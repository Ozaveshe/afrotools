/**
 * AFROTOOLS — Calculation History Module
 * ═══════════════════════════════════════════════════════════
 * Save/load calculation history to the user's Supabase account.
 * Uses AfroAuth for authentication and Supabase client access.
 *
 * Usage:
 *   await AfroHistory.save({ toolSlug, toolName, countryCode, currency, inputs, outputs });
 *   await AfroHistory.getRecent(10);
 *   await AfroHistory.getByTool('ng-paye', 20);
 *   await AfroHistory.delete(id);
 *   await AfroHistory.getMonthlyCount();
 * ═══════════════════════════════════════════════════════════
 */
(function (window) {
  'use strict';

  var FREE_LIMIT = 5;

  function _sb() {
    return window.AfroAuth && AfroAuth.getSupabase ? AfroAuth.getSupabase() : null;
  }

  function _loggedIn() {
    return window.AfroAuth && AfroAuth.isLoggedIn && AfroAuth.isLoggedIn();
  }

  function _userId() {
    if (!_loggedIn()) return null;
    var u = AfroAuth.getUser();
    return u ? u.id : null;
  }

  function _isPro() {
    return window.AfroAuth && AfroAuth.isPro && AfroAuth.isPro();
  }

  function _monthStart() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  }

  window.AfroHistory = {

    /**
     * Save a calculation result.
     * @param {Object} params
     * @param {string} params.toolSlug
     * @param {string} params.toolName
     * @param {string} [params.countryCode]
     * @param {string} [params.currency]
     * @param {Object} params.inputs
     * @param {Object} params.outputs
     * @returns {Promise<Object>}
     */
    save: async function (params) {
      if (!_loggedIn()) return { saved: false, reason: 'not_logged_in' };

      var sb = _sb();
      if (!sb) return { saved: false, reason: 'supabase_unavailable' };

      var userId = _userId();
      if (!userId) return { saved: false, reason: 'not_logged_in' };

      // Check free tier limit
      if (!_isPro()) {
        try {
          var countRes = await sb
            .from('calculation_history')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', _monthStart());

          var count = countRes.count || 0;
          if (count >= FREE_LIMIT) {
            return { saved: false, reason: 'limit_reached', limit: FREE_LIMIT };
          }
        } catch (e) {
          // If count check fails, allow the save (RLS/server will enforce)
        }
      }

      try {
        var res = await sb
          .from('calculation_history')
          .insert({
            user_id: userId,
            tool_slug: params.toolSlug,
            tool_name: params.toolName,
            country_code: params.countryCode || null,
            currency: params.currency || null,
            inputs: params.inputs,
            outputs: params.outputs
          })
          .select('id')
          .single();

        if (res.error) return { saved: false, reason: 'db_error', error: res.error.message };
        return { saved: true, id: res.data.id };
      } catch (e) {
        return { saved: false, reason: 'network_error', error: e.message };
      }
    },

    /**
     * Get recent calculations for the current user.
     * @param {number} [limit=10]
     * @returns {Promise<Array>}
     */
    getRecent: async function (limit) {
      if (!_loggedIn()) return [];
      var sb = _sb();
      if (!sb) return [];

      try {
        var res = await sb
          .from('calculation_history')
          .select('*')
          .eq('user_id', _userId())
          .order('created_at', { ascending: false })
          .limit(limit || 10);

        return res.data || [];
      } catch (e) {
        return [];
      }
    },

    /**
     * Get calculations for a specific tool.
     * @param {string} toolSlug
     * @param {number} [limit=20]
     * @returns {Promise<Array>}
     */
    getByTool: async function (toolSlug, limit) {
      if (!_loggedIn()) return [];
      var sb = _sb();
      if (!sb) return [];

      try {
        var res = await sb
          .from('calculation_history')
          .select('*')
          .eq('user_id', _userId())
          .eq('tool_slug', toolSlug)
          .order('created_at', { ascending: false })
          .limit(limit || 20);

        return res.data || [];
      } catch (e) {
        return [];
      }
    },

    /**
     * Delete a saved calculation.
     * @param {string} id - UUID of the record
     * @returns {Promise<Object>}
     */
    delete: async function (id) {
      if (!_loggedIn()) return { deleted: false, error: 'Not logged in' };
      var sb = _sb();
      if (!sb) return { deleted: false, error: 'Supabase unavailable' };

      try {
        var res = await sb
          .from('calculation_history')
          .delete()
          .eq('id', id)
          .eq('user_id', _userId());

        if (res.error) return { deleted: false, error: res.error.message };
        return { deleted: true };
      } catch (e) {
        return { deleted: false, error: e.message };
      }
    },

    /**
     * Get this month's save count and limits.
     * @returns {Promise<Object>}
     */
    getMonthlyCount: async function () {
      var tier = _isPro() ? 'pro' : 'free';
      if (!_loggedIn()) return { count: 0, limit: FREE_LIMIT, tier: tier };
      var sb = _sb();
      if (!sb) return { count: 0, limit: FREE_LIMIT, tier: tier };

      try {
        var res = await sb
          .from('calculation_history')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', _userId())
          .gte('created_at', _monthStart());

        return {
          count: res.count || 0,
          limit: tier === 'pro' ? Infinity : FREE_LIMIT,
          tier: tier
        };
      } catch (e) {
        return { count: 0, limit: FREE_LIMIT, tier: tier };
      }
    }
  };

})(window);
