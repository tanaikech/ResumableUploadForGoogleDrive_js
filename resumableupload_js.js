"use strict";
/**
 * ResumableUploadToGoogleDrive for Javascript library
 * GitHub  https://github.com/tanaikech/ResumableUploadForGoogleDrive_js<br>
 */
(function(r) {
  let ResumableUploadToGoogleDrive;
  ResumableUploadToGoogleDrive = (function() {
    function ResumableUploadToGoogleDrive() {
      this.obj = {};
      this.chunkSize = 52428800;
      this.partsOfChunks = 10;
      this.endpoint =
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable";
    }

    /**
     * Run resumable upload a file.
     * @param {Object} resource the object for resumable uploading a file.
     */
    ResumableUploadToGoogleDrive.prototype.Do = async function(
      resource,
      callback
    ) {
      callback({ status: "initialize" }, null);
      try {
        this.obj = await init.call(this, resource);
      } catch (err) {
        callback(null, err);
        return;
      }
      const uint8Array = new Uint8Array(this.obj.resource.fileBuffer);
      const chunkPot = getChunkPot.call(this);
      const chunks = chunkPot.chunks.map(function(e) {
        return {
          data: uint8Array.slice(e.startByte, e.endByte + 1),
          length: e.numByte,
          range:
            "bytes " + e.startByte + "-" + e.endByte + "/" + chunkPot.total,
          startByte: e.startByte,
          endByte: e.endByte,
          total: chunkPot.total
        };
      });
      try {
        const head = await getLocation.call(this);
        this.location = head.get("location");
        callback({ status: "getLocation" }, null);
        doUpload.call(this, chunks, function(res, err) {
          if (err) {
            callback(null, err);
            return;
          }
          callback(res, null);
          return;
        });
      } catch (err) {
        callback(null, err);
        return;
      }
    };

    const init = function(resource) {
      return new Promise((resolve, reject) => {
        if (
          !("accessToken" in resource) ||
          !("fileName" in resource) ||
          !("fileSize" in resource) ||
          !("fileType" in resource) ||
          !("fileBuffer" in resource)
        ) {
          reject({
            Error:
              "There are no required parameters. accessToken, fileName, fileSize, fileType and fileBuffer are required."
          });
          return;
        }
        let object = {};
        object.resource = resource;
        if (
          "chunkSize" in resource &&
          resource.chunkSize >= 262144 &&
          resource.chunkSize % 1024 == 0
        ) {
          this.chunkSize = resource.chunkSize;
        }
        if (
          "partsOfChunks" in resource &&
          resource.partsOfChunks <= 20 &&
          resource.partsOfChunks === parseInt(resource.partsOfChunks, 10)
        ) {
          this.partsOfChunks = resource.partsOfChunks;
        }
        if ("fields" in resource && resource.fields != "") {
          this.endpoint += "&fields=" + encodeURIComponent(resource.fields);
        }
        if ("convertToGoogleDocs" in resource && resource.convertToGoogleDocs) {
          fetch(
            "https://www.googleapis.com/drive/v3/about?fields=importFormats",
            {
              method: "GET",
              headers: { Authorization: "Bearer " + resource.accessToken }
            }
          )
            .then(res => {
              if (res.status != 200) {
                res.json().then(e => reject(e));
                return;
              }
              res.json().then(res => {
                if (resource.fileType in res.importFormats) {
                  object.resource.fileType =
                    res.importFormats[resource.fileType][0];
                }
                resolve(object);
              });
            })
            .catch(err => {
              reject(err);
            });
        } else {
          resolve(object);
        }
      });
    };

    const getChunkPot = function() {
      const chunkSize = this.chunkSize;
      const fileSize = this.obj.resource.fileSize;
      let chunkPot = {};
      chunkPot.total = fileSize;
      chunkPot.chunks = [];
      let numE =
        fileSize > chunkSize
          ? chunkSize
          : Math.ceil(fileSize / (262144 * this.partsOfChunks)) * 262144;
      const endS = (function(f, n) {
        const c = f % n;
        if (c == 0) {
          return 0;
        } else {
          return c;
        }
      })(fileSize, numE);
      const repeat = Math.floor(fileSize / numE);
      for (let i = 0; i <= repeat; i++) {
        const startAddress = i * numE;
        let c = {};
        c.startByte = startAddress;
        if (i < repeat) {
          c.endByte = startAddress + numE - 1;
          c.numByte = numE;
          chunkPot.chunks.push(c);
        } else if (i == repeat && endS > 0) {
          c.endByte = startAddress + endS - 1;
          c.numByte = endS;
          chunkPot.chunks.push(c);
        }
      }
      return chunkPot;
    };

    const getLocation = function() {
      return new Promise((resolve, reject) => {
        const resource = this.obj.resource;
        const accessToken = resource.accessToken;
        let metadata = {
          mimeType: resource.fileType,
          name: resource.fileName
        };
        if ("folderId" in resource && resource.folderId != "") {
          metadata.parents = [resource.folderId];
        }
        fetch(this.endpoint, {
          method: "POST",
          body: JSON.stringify(metadata),
          headers: {
            Authorization: "Bearer " + accessToken,
            "Content-Type": "application/json"
          }
        })
          .then(res => {
            if (res.status != 200) {
              res.json().then(e => reject(e));
              return;
            }
            resolve(res.headers);
          })
          .catch(err => {
            reject(err);
          });
      });
    };

    const doUpload = function(chunks, callback) {
      callback({ status: "start" }, null);
      const location = this.location;
      const end = chunks.length;
      let cnt = 0;
      const doFetch = function(cnt) {
        const e = chunks[cnt];
        callback(
          {
            status: "Uploading",
            progressNumber: { current: cnt, end: end },
            progressByte: {
              current: e.startByte,
              end: e.endByte,
              total: e.total
            }
          },
          null
        );
        fetch(location, {
          method: "PUT",
          body: e.data,
          headers: {
            "Content-Range": e.range
          }
        })
          .then(res => {
            const status = res.status;
            cnt += 1;
            if (status == 308) {
              doFetch(cnt);
            } else if (status == 200) {
              res
                .json()
                .then(r => callback({ status: "Done", result: r }, null));
            } else {
              res.json().then(err => {
                err.additionalInformation =
                  "When the file size is large, there is the case that the file cannot be converted to Google Docs. Please be careful this.";
                callback(null, err);
                return;
              });
              return;
            }
          })
          .catch(err => {
            callback(null, err);
            return;
          });
      };
      doFetch(cnt);
    };

    return ResumableUploadToGoogleDrive;
  })();

  return (r.ResumableUploadToGoogleDrive = ResumableUploadToGoogleDrive);
})(this);
