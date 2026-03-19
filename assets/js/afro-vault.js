/**
 * AfroVault — Document Vault API
 *
 * Upload, list, download, and delete user documents stored in Supabase Storage.
 * Uses the DATA Supabase instance (jbmhfpkzbgyeodsqhprx).
 *
 * Free tier: max 5 documents. Pro tier: max 50 documents.
 */
(function (window) {
  'use strict';

  var DATA_URL = 'https://jbmhfpkzbgyeodsqhprx.supabase.co';
  var DATA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpibWhmcGt6Ymd5ZW9kc3FocHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY2MDcsImV4cCI6MjA1NzY5MjYwN30.gVLMsMVjqEMOCMCFnPBHaf8njEhNPGUB2v3XnDnlqSM';
  var BUCKET = 'vault';
  var FREE_LIMIT = 5;
  var PRO_LIMIT = 50;

  var _sb = null;

  function _getSupabase() {
    if (_sb) return _sb;
    if (window.AfroAuth && typeof AfroAuth.getSupabase === 'function') {
      _sb = AfroAuth.getSupabase();
    } else if (window.supabase && window.supabase.createClient) {
      _sb = window.supabase.createClient(DATA_URL, DATA_KEY);
    }
    return _sb;
  }

  function _getUserId() {
    if (window.AfroAuth && AfroAuth.isLoggedIn && AfroAuth.isLoggedIn()) {
      var u = AfroAuth.getUser();
      return u && u.id ? u.id : null;
    }
    return null;
  }

  function _getTier() {
    if (window.AfroAuth && AfroAuth.getUser) {
      var u = AfroAuth.getUser();
      if (u && u.tier === 'pro') return 'pro';
    }
    return 'free';
  }

  function _getLimit() {
    return _getTier() === 'pro' ? PRO_LIMIT : FREE_LIMIT;
  }

  function _uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  window.AfroVault = {
    /**
     * Upload a File to vault.
     * @param {Object} opts - { file: File, fileName: string, toolSlug: string, tags: string[] }
     * @returns {Promise<{uploaded: boolean, id?: string, reason?: string}>}
     */
    async upload(opts) {
      var file = opts.file;
      var fileName = opts.fileName || file.name || 'document.pdf';
      var toolSlug = opts.toolSlug || '';
      var tags = opts.tags || [];

      var userId = _getUserId();
      if (!userId) return { uploaded: false, reason: 'not_logged_in' };

      var sb = _getSupabase();
      if (!sb) return { uploaded: false, reason: 'supabase_unavailable' };

      // Check document count
      var stats = await this.getStats();
      if (stats.count >= stats.limit) {
        return { uploaded: false, reason: 'limit_reached', limit: stats.limit, tier: stats.tier };
      }

      // Build storage path
      var ext = fileName.split('.').pop() || 'pdf';
      var storagePath = userId + '/' + _uuid() + '-' + fileName;

      // Upload to Supabase Storage
      var { data: uploadData, error: uploadError } = await sb.storage
        .from(BUCKET)
        .upload(storagePath, file, {
          contentType: file.type || 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        console.error('[AfroVault] Upload error:', uploadError);
        return { uploaded: false, reason: uploadError.message || 'upload_failed' };
      }

      // Insert record into vault_documents
      var { data: record, error: dbError } = await sb
        .from('vault_documents')
        .insert({
          user_id: userId,
          file_name: fileName,
          file_type: ext,
          file_size: file.size,
          storage_path: storagePath,
          tool_slug: toolSlug,
          tags: tags
        })
        .select('id')
        .single();

      if (dbError) {
        console.error('[AfroVault] DB insert error:', dbError);
        // Clean up uploaded file
        await sb.storage.from(BUCKET).remove([storagePath]);
        return { uploaded: false, reason: dbError.message || 'db_error' };
      }

      return { uploaded: true, id: record.id };
    },

    /**
     * Upload from a Blob (for tool-generated PDFs).
     */
    async uploadBlob(opts) {
      var blob = opts.blob;
      var fileName = opts.fileName || 'document.pdf';
      var file = new File([blob], fileName, { type: blob.type || 'application/pdf' });
      return this.upload({
        file: file,
        fileName: fileName,
        toolSlug: opts.toolSlug || '',
        tags: opts.tags || []
      });
    },

    /**
     * List user's documents.
     */
    async list(opts) {
      opts = opts || {};
      var limit = opts.limit || 20;
      var offset = opts.offset || 0;

      var userId = _getUserId();
      if (!userId) return [];

      var sb = _getSupabase();
      if (!sb) return [];

      var { data, error } = await sb
        .from('vault_documents')
        .select('id, file_name, file_type, file_size, storage_path, tool_slug, tags, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('[AfroVault] List error:', error);
        return [];
      }
      return data || [];
    },

    /**
     * Get a temporary signed download URL (1 hour expiry).
     */
    async getUrl(documentId) {
      var userId = _getUserId();
      if (!userId) return null;

      var sb = _getSupabase();
      if (!sb) return null;

      // Get storage path from DB
      var { data: doc, error: dbErr } = await sb
        .from('vault_documents')
        .select('storage_path')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (dbErr || !doc) return null;

      // Generate signed URL
      var { data: signed, error: signErr } = await sb.storage
        .from(BUCKET)
        .createSignedUrl(doc.storage_path, 3600);

      if (signErr || !signed) return null;

      return {
        url: signed.signedUrl,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
      };
    },

    /**
     * Delete a document (storage + DB record).
     */
    async delete(documentId) {
      var userId = _getUserId();
      if (!userId) return { deleted: false };

      var sb = _getSupabase();
      if (!sb) return { deleted: false };

      // Get storage path
      var { data: doc, error: dbErr } = await sb
        .from('vault_documents')
        .select('storage_path')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (dbErr || !doc) return { deleted: false };

      // Delete from storage
      await sb.storage.from(BUCKET).remove([doc.storage_path]);

      // Delete DB record
      var { error: delErr } = await sb
        .from('vault_documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', userId);

      if (delErr) {
        console.error('[AfroVault] Delete error:', delErr);
        return { deleted: false };
      }

      return { deleted: true };
    },

    /**
     * Get vault usage stats.
     */
    async getStats() {
      var userId = _getUserId();
      var tier = _getTier();
      var limit = _getLimit();

      if (!userId) return { count: 0, totalSize: 0, limit: limit, tier: tier };

      var sb = _getSupabase();
      if (!sb) return { count: 0, totalSize: 0, limit: limit, tier: tier };

      var { data, error } = await sb
        .from('vault_documents')
        .select('file_size')
        .eq('user_id', userId);

      if (error || !data) return { count: 0, totalSize: 0, limit: limit, tier: tier };

      var totalSize = 0;
      for (var i = 0; i < data.length; i++) totalSize += (data[i].file_size || 0);

      return { count: data.length, totalSize: totalSize, limit: limit, tier: tier };
    }
  };
})(window);
