/**
 * ResumableUploadToGoogleDrive for Javascript library
 * GitHub  https://github.com/tanaikech/ResumableUploadForGoogleDrive2_js<br>
 * In this Class ResumableUploadToGoogleDrive2, the selected file is uploaded by splitting data on the disk. By this, the large file can be uploaded.<br>
 */
(function (r) {
  let ResumableUploadToGoogleDrive2;
  ResumableUploadToGoogleDrive2 = (function () {
    function ResumableUploadToGoogleDrive2() {
      this.obj = {};
      this.chunkSize = 52428800;
      this.endpoint =
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable";
    }

    /**
     * Run resumable upload a file.
     * @param {Object} resource the object for resumable uploading a file.
     */
    ResumableUploadToGoogleDrive2.prototype.Do = async function (
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
      try {
        const head = await getLocation.call(this);
        this.location = head.get("location");
        callback({ status: "getLocation" }, null);
        callback({ status: "start" }, null);
        const fileSize = resource.file.size;
        const len = Math.ceil(fileSize / this.chunkSize);
        for (let i = 0; i < len; i++) {
          let start = i * this.chunkSize;
          let end =
            fileSize < start + this.chunkSize
              ? fileSize
              : start + this.chunkSize;
          let data = resource.file.slice(start, end);
          end -= 1;
          callback(
            {
              status: "Uploading",
              progressNumber: { current: i, end: len },
              progressByte: {
                current: start,
                end: end,
                total: fileSize,
              },
            },
            null
          );
          try {
            const res = await getFile.call(this, {
              fileSize,
              len,
              start,
              end,
              data,
              i,
            });
            if (
              res.status == "Next" ||
              (res.status == "Done" && i == len - 1)
            ) {
              callback(res, null);
            } else {
              callback(null, "Internal error.");
              return;
            }
          } catch (err) {
            callback(null, err);
            return;
          }
        }
      } catch (err) {
        callback(null, err);
        return;
      }
    };

    const init = function (resource) {
      return new Promise((resolve, reject) => {
        if (!("accessToken" in resource) || !("file" in resource)) {
          reject({
            Error:
              "There are no required parameters. accessToken, fileName, fileSize, fileType and fileBuffer are required.",
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
        if ("fields" in resource && resource.fields != "") {
          this.endpoint += "&fields=" + encodeURIComponent(resource.fields);
        }
        if ("convertToGoogleDocs" in resource && resource.convertToGoogleDocs) {
          fetch(
            "https://www.googleapis.com/drive/v3/about?fields=importFormats",
            {
              method: "GET",
              headers: { Authorization: "Bearer " + resource.accessToken },
            }
          )
            .then((res) => {
              if (res.status != 200) {
                res.json().then((e) => reject(e));
                return;
              }
              res.json().then((res) => {
                if (resource.file.type in res.importFormats) {
                  object.resource.fileType =
                    res.importFormats[resource.fileType][0];
                }
                resolve(object);
              });
            })
            .catch((err) => {
              reject(err);
            });
        } else {
          resolve(object);
        }
      });
    };

    const getLocation = function () {
      return new Promise((resolve, reject) => {
        const resource = this.obj.resource;
        const accessToken = resource.accessToken;
        let metadata = {
          mimeType: resource.file.type,
          name: resource.file.name,
        };
        if ("folderId" in resource && resource.folderId != "") {
          metadata.parents = [resource.folderId];
        }
        fetch(this.endpoint, {
          method: "POST",
          body: JSON.stringify(metadata),
          headers: {
            Authorization: "Bearer " + accessToken,
            "Content-Type": "application/json",
          },
        })
          .then((res) => {
            if (res.status != 200) {
              res.json().then((e) => reject(e));
              return;
            }
            resolve(res.headers);
          })
          .catch((err) => {
            reject(err);
          });
      });
    };

    const getFile = function ({ fileSize, len, start, end, data, i }) {
      const location = this.location;
      return new Promise(function (resolve, reject) {
        const fr = new FileReader();
        fr.onload = async function () {
          const buf = fr.result;
          const obj = {
            data: new Uint8Array(buf),
            length: end - start + 1,
            range: "bytes " + start + "-" + end + "/" + fileSize,
            startByte: start,
            endByte: end,
            total: fileSize,
            cnt: i,
            totalChunkNumber: len,
          };
          await doUpload(obj, location)
            .then((res) => resolve(res))
            .catch((err) => reject(err));
        };
        fr.readAsArrayBuffer(data);
      });
    };

    const doUpload = function (e, url) {
      return new Promise(function (resolve, reject) {
        fetch(url, {
          method: "PUT",
          body: e.data,
          headers: { "Content-Range": e.range },
        })
          .then((res) => {
            const status = res.status;
            if (status == 308) {
              resolve({ status: "Next", result: r });
            } else if (status == 200) {
              res.json().then((r) => resolve({ status: "Done", result: r }));
            } else {
              res.json().then((err) => {
                err.additionalInformation =
                  "When the file size is large, there is the case that the file cannot be converted to Google Docs. Please be careful this.";
                reject(err);
                return;
              });
              return;
            }
          })
          .catch((err) => {
            reject(err);
            return;
          });
      });
    };

    return ResumableUploadToGoogleDrive2;
  })();

  return (r.ResumableUploadToGoogleDrive2 = ResumableUploadToGoogleDrive2);
})(this);
