!function () {
  "use strict";

  var QPDF_BASE_PATH = "/assets/vendor/qpdf/";
  var loader = null;

  function randomOwnerPassword() {
    var bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(function (byte) {
      return byte.toString(16).padStart(2, "0");
    }).join("");
  }

  function toArrayBuffer(bytes) {
    if (bytes instanceof ArrayBuffer) return bytes;
    if (ArrayBuffer.isView(bytes)) return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    throw new Error("Expected PDF bytes.");
  }

  function trimAfterEof(bytes) {
    var marker = [37, 37, 69, 79, 70];
    for (var i = bytes.length - marker.length; i >= 0; i--) {
      var match = true;
      for (var j = 0; j < marker.length; j++) {
        if (bytes[i + j] !== marker[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        var end = i + marker.length;
        while (end < bytes.length && (bytes[end] === 10 || bytes[end] === 13 || bytes[end] === 32 || bytes[end] === 9)) end++;
        return bytes.slice(0, end);
      }
    }
    return bytes;
  }

  function ensure() {
    if (window.QPDF) {
      window.QPDF.path = QPDF_BASE_PATH;
      return Promise.resolve(window.QPDF);
    }

    if (!loader) {
      loader = new Promise(function (resolve, reject) {
        var src = QPDF_BASE_PATH + "qpdf.js";
        var existing = document.querySelector('script[src="' + src + '"]');
        if (existing) {
          existing.addEventListener("load", resolve, { once: true });
          existing.addEventListener("error", function () {
            reject(new Error("Could not load QPDF."));
          }, { once: true });
          if (window.QPDF) resolve();
          return;
        }

        var script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = function () {
          reject(new Error("Could not load QPDF."));
        };
        document.head.appendChild(script);
      }).then(function () {
        if (!window.QPDF) throw new Error("QPDF failed to initialize.");
        window.QPDF.path = QPDF_BASE_PATH;
        return window.QPDF;
      });
    }

    return loader;
  }

  function run(inputBytes, args, outputName) {
    outputName = outputName || "output.pdf";
    return ensure().then(function (QPDF) {
      return new Promise(function (resolve, reject) {
        QPDF({
          logger: function () {},
          ready: function (fs) {
            fs.save("input.pdf", toArrayBuffer(inputBytes), function (saveError) {
              if (saveError) {
                reject(saveError);
                return;
              }

              fs.execute(args, function (execError) {
                if (execError) {
                  reject(execError);
                  return;
                }

                fs.load(outputName, function (loadError, outputBytes) {
                  if (loadError) {
                    reject(loadError);
                    return;
                  }
                  resolve(trimAfterEof(new Uint8Array(outputBytes)));
                });
              });
            });
          }
        });
      });
    });
  }

  function normalizePermissions(options) {
    var allowEdit = options.allowEdit !== false;
    return {
      allowPrint: options.allowPrint !== false,
      allowCopy: options.allowCopy !== false,
      allowEdit: allowEdit,
      allowAnnotate: options.allowAnnotate == null ? allowEdit : options.allowAnnotate !== false,
      allowForm: options.allowForm == null ? allowEdit : options.allowForm !== false,
      allowAssemble: options.allowAssemble == null ? allowEdit : options.allowAssemble !== false
    };
  }

  function buildEncryptArgs(options) {
    options = options || {};
    var userPassword = options.userPassword || "";
    if (!userPassword) throw new Error("Enter a user password.");

    var ownerPassword = options.ownerPassword || randomOwnerPassword();
    if (ownerPassword === userPassword) ownerPassword = ownerPassword + "-" + randomOwnerPassword();

    var perms = normalizePermissions(options);
    return {
      ownerPassword: ownerPassword,
      args: [
        "--encrypt", userPassword, ownerPassword, "256",
        "--print=" + (perms.allowPrint ? "full" : "none"),
        "--extract=" + (perms.allowCopy ? "y" : "n"),
        "--modify=" + (perms.allowEdit ? "all" : "none"),
        "--annotate=" + (perms.allowAnnotate ? "y" : "n"),
        "--form=" + (perms.allowForm ? "y" : "n"),
        "--assemble=" + (perms.allowAssemble ? "y" : "n"),
        "--", "input.pdf", "output.pdf"
      ],
      permissions: perms
    };
  }

  window.AfroQPDF = {
    ensure: ensure,
    run: run,
    encrypt: function (inputBytes, options) {
      var request = buildEncryptArgs(options);
      return run(inputBytes, request.args, "output.pdf").then(function (bytes) {
        return {
          bytes: bytes,
          ownerPassword: request.ownerPassword,
          permissions: request.permissions
        };
      });
    },
    decrypt: function (inputBytes, password) {
      if (!password) throw new Error("Enter the PDF password.");
      return run(inputBytes, ["--password=" + password, "--decrypt", "--", "input.pdf", "output.pdf"], "output.pdf");
    }
  };
}();
