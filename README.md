# ResumableUploadForGoogleDrive_js

[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENCE)

<a name="top"></a>

# Overview

This is a Javascript library to achieve the resumable upload for Google Drive.

# Description

When a file more than 5 MB is uploaded to Google Drive with Drive API, [the resumable upload](https://developers.google.com/drive/api/v3/manage-uploads#resumable) is required to be used. I have already published the sample script for "Resumable Upload for Web Apps using Google Apps Script". [Ref](https://github.com/tanaikech/Resumable_Upload_For_WebApps) In this case, Web Apps is used. Here, I would like to introduce the script for the resumable upload created by only Javascript. Unfortunately, in the current stage, at [google-api-javascript-client](https://github.com/google/google-api-javascript-client), there are no methods for the resumable upload. And, I thought that when this function is created as a Javascript library, it might be useful for users. Also that library is also useful for me. So I created this. If this was useful for your situation, I'm glad.

# Install

## Class ResumableUploadToGoogleDrive

```html
<script src="resumableupload_js.min.js"></script>
```

Or, using jsdelivr cdn

```html
<script src="https://cdn.jsdelivr.net/gh/tanaikech/ResumableUploadForGoogleDrive_js@master/resumableupload_js.min.js"></script>
```

## Class ResumableUploadToGoogleDrive2

```html
<script src="resumableupload2_js.min.js"></script>
```

Or, using jsdelivr cdn

```html
<script src="https://cdn.jsdelivr.net/gh/tanaikech/ResumableUploadForGoogleDrive_js/resumableupload2_js.min.js"></script>
```

# Classes

This library has 2 Classes.

1. [Class ResumableUploadToGoogleDrive](#resumableuploadtogoogledrive)

   - This Class can achieve the resumable upload of a file by reading the file to the memory.

2. [Class ResumableUploadToGoogleDrive2](#resumableuploadtogoogledrive2)

   - This Class can achieve the resumable upload of a file by directly reading partially the file from the local Disk. By this, the large file which is over the memory of the local PC can be uploaded.

<a name="usage"></a>

<a name="resumableuploadtogoogledrive"></a>

# Usage: Class ResumableUploadToGoogleDrive

In order to use this library, please prepare your access token. The access token can be retrieved by OAuth2 and Service account.

Document of OAuth2 is [here](https://developers.google.com/identity/protocols/OAuth2).

## Sample script 1

This is a simple sample script. In this sample script, it supposes that the access token is retrieved by [Google APIs Client Library for browser JavaScript, aka gapi](https://github.com/google/google-api-javascript-client).

```html
<script src="https://cdn.jsdelivr.net/gh/tanaikech/ResumableUploadForGoogleDrive_js/resumableupload_js.min.js"></script>

<body>
  <form>
    <input name="file" id="uploadfile" type="file" />
  </form>
  <div id="progress"></div>
</body>

<script>
  const accessToken = gapi.auth.getToken().access_token; // Please set access token here.

  document.getElementById("uploadfile").addEventListener("change", run, false);

  function run(obj) {
    const file = obj.target.files[0];
    if (file.name != "") {
      let fr = new FileReader();
      fr.fileName = file.name;
      fr.fileSize = file.size;
      fr.fileType = file.type;
      fr.readAsArrayBuffer(file);
      fr.onload = resumableUpload;
    }
  }

  function resumableUpload(e) {
    document.getElementById("progress").innerHTML = "Initializing.";
    const f = e.target;
    const resource = {
      fileName: f.fileName,
      fileSize: f.fileSize,
      fileType: f.fileType,
      fileBuffer: f.result,
      accessToken: accessToken,
    };
    const ru = new ResumableUploadToGoogleDrive();
    ru.Do(resource, function (res, err) {
      if (err) {
        console.log(err);
        return;
      }
      console.log(res);
      let msg = "";
      if (res.status == "Uploading") {
        msg =
          Math.round(
            (res.progressNumber.current / res.progressNumber.end) * 100
          ) + "%";
      } else {
        msg = res.status;
      }
      document.getElementById("progress").innerText = msg;
    });
  }
</script>
```

- When you use above sample script, the uploading file is created in the root folder of Google Drive without converting to Google Docs.

## Sample script 2

In this sample script, the file is uploaded using the sidebar on Spreadsheet.

### Google Apps Script: Code.gs

```javascript
function getAuth() {
  // DriveApp.createFile(blob) // This is used for adding the scope of "https://www.googleapis.com/auth/drive".
  return ScriptApp.getOAuthToken();
}

function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile("index");
  SpreadsheetApp.getUi().showSidebar(html);
}
```

### Javascript: index.html

```html
<form><input name="file" id="uploadfile" type="file" /></form>
<div id="progress"></div>

<script src="https://cdn.jsdelivr.net/gh/tanaikech/ResumableUploadForGoogleDrive_js/resumableupload_js.min.js"></script>

<script>
  document.getElementById("uploadfile").addEventListener("change", run, false);

  function run(obj) {
    google.script.run
      .withSuccessHandler((accessToken) =>
        ResumableUploadForGoogleDrive(accessToken, obj)
      )
      .getAuth();
  }

  function ResumableUploadForGoogleDrive(accessToken, obj) {
    const file = obj.target.files[0];
    if (file.name != "") {
      let fr = new FileReader();
      fr.fileName = file.name;
      fr.fileSize = file.size;
      fr.fileType = file.type;
      fr.accessToken = accessToken;
      fr.readAsArrayBuffer(file);
      fr.onload = resumableUpload;
    }
  }

  function resumableUpload(e) {
    document.getElementById("progress").innerHTML = "Initializing.";
    const f = e.target;
    const resource = {
      fileName: f.fileName,
      fileSize: f.fileSize,
      fileType: f.fileType,
      fileBuffer: f.result,
      accessToken: f.accessToken,
    };
    const ru = new ResumableUploadToGoogleDrive();
    ru.Do(resource, function (res, err) {
      if (err) {
        console.log(err);
        return;
      }
      console.log(res);
      let msg = "";
      if (res.status == "Uploading") {
        msg =
          Math.round(
            (res.progressNumber.current / res.progressNumber.end) * 100
          ) + "%";
      } else {
        msg = res.status;
      }
      document.getElementById("progress").innerText = msg;
    });
  }
</script>
```

## Sample script 3

[Resumable Upload of Multiple Files with Asynchronous Process for Google Drive](https://github.com/tanaikech/AsynchronousResumableUploadForGoogleDrive)

![](https://github.com/tanaikech/AsynchronousResumableUploadForGoogleDrive/raw/master/images/demo.gif)

### Overview

This is a sample script for uploading multiple files with large size (> 50 MB) at the sidebar, dialog of Google Docs and Web Apps using the resumable upload of the asynchronous process with Javascript and Google Apps Script (GAS).

## `resource` for Method of `Do()`

There are several properties in the object `resource` for the method of `Do()` as follows.

### Requirement properties

- `fileName` : Filename of uploading file.
- `fileSize` : File size of uploading file.
- `fileType` : MimeType of uploading file.
- `fileBuffer` : Buffer of uploading file.
- `accessToken` : Access token for uploading with Drive API.

### Optional properties

- `folderId` : Destination folder ID of uploading file. When this property is not used, the uploaded file is created to the root folder of Google Drive.
- `convertToGoogleDocs` : If this property is used as `true`, the uploaded file is converted to Google Docs. But in this case, if the file size is large, an error might occur. Please be careful this. The default value is `false`. So the file is uploaded without converting.
- `fields` : As a sample case, if you want to retrieve only file ID, please use `id`.
- `chunkSize` : If you want to change the chunk size for the resumable upload, please use this. The default value is `52428800` (50 MB). This value is required to be in multiples of 256 KB (256 x 1024 bytes). Please be careful about this. [Ref](https://developers.google.com/drive/api/guides/manage-uploads#uploading)

<a name="resumableuploadtogoogledrive2"></a>

# Usage: Class ResumableUploadToGoogleDrive2

In order to use this library, please prepare your access token. The access token can be retrieved by OAuth2 and Service account.

Document of OAuth2 is [here](https://developers.google.com/identity/protocols/OAuth2).

## Sample script 1

This is a simple sample script. In this sample script, it supposes that the access token is retrieved by [Google APIs Client Library for browser JavaScript, aka gapi](https://github.com/google/google-api-javascript-client).

```html
<script src="https://cdn.jsdelivr.net/gh/tanaikech/ResumableUploadForGoogleDrive_js/resumableupload2_js.min.js"></script>

<body>
  <form>
    <input name="file" id="uploadfile" type="file" />
  </form>
  <div id="progress"></div>
</body>

<script>
  const accessToken = gapi.auth.getToken().access_token; // Please set access token here.

  document.getElementById("uploadfile").addEventListener("change", run, false);

  function run(obj) {
    const resource = {
      file: obj.target.files[0],
      accessToken: accessToken,
    };
    resumableUpload(resource);
  }

  function resumableUpload(resource) {
    document.getElementById("progress").innerHTML = "Initializing.";

    const ru = new ResumableUploadToGoogleDrive2();
    ru.Do(resource, function (res, err) {
      if (err) {
        console.log(err);
        return;
      }
      console.log(res);
      let msg = "";
      if (res.status == "Uploading") {
        msg =
          Math.round(
            (res.progressNumber.current / res.progressNumber.end) * 100
          ) + "%";
      } else {
        msg = res.status;
      }
      document.getElementById("progress").innerText = msg;
    });
  }
</script>
```

- When you use above sample script, the uploading file is created in the root folder of Google Drive without converting to Google Docs.

## Sample script 2

In this sample script, the file is uploaded using the sidebar on Spreadsheet.

### Google Apps Script: Code.gs

```javascript
function getAuth() {
  // DriveApp.createFile(blob) // This is used for adding the scope of "https://www.googleapis.com/auth/drive".
  return ScriptApp.getOAuthToken();
}

function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile("index");
  SpreadsheetApp.getUi().showSidebar(html);
}
```

### Javascript: index.html

```html
<form><input name="file" id="uploadfile" type="file" /></form>
<div id="progress"></div>

<script src="https://cdn.jsdelivr.net/gh/tanaikech/ResumableUploadForGoogleDrive_js/resumableupload2_js.min.js"></script>

<script>
  document.getElementById("uploadfile").addEventListener("change", run, false);

  function run(obj) {
    google.script.run
      .withSuccessHandler((accessToken) =>
        resumableUpload({
          file: obj.target.files[0],
          accessToken: accessToken,
        })
      )
      .getAuth();
  }

  function resumableUpload(resource) {
    document.getElementById("progress").innerHTML = "Initializing.";

    const ru = new ResumableUploadToGoogleDrive2();
    ru.Do(resource, function (res, err) {
      if (err) {
        console.log(err);
        return;
      }
      console.log(res);
      let msg = "";
      if (res.status == "Uploading") {
        msg =
          Math.round(
            (res.progressNumber.current / res.progressNumber.end) * 100
          ) + "%";
      } else {
        msg = res.status;
      }
      document.getElementById("progress").innerText = msg;
    });
  }
</script>
```

### Overview

This is a sample script for uploading multiple files with large size (> 50 MB) at the sidebar, dialog of Google Docs and Web Apps using the resumable upload of the asynchronous process with Javascript and Google Apps Script (GAS).

## `resource` for Method of `Do()`

There are several properties in the object `resource` for the method of `Do()` as follows.

### Requirement properties

- `fileName` : Filename of uploading file.
- `fileSize` : File size of uploading file.
- `fileType` : MimeType of uploading file.
- `fileBuffer` : Buffer of uploading file.
- `accessToken` : Access token for uploading with Drive API.

### Optional properties

- `folderId` : Destination folder ID of uploading file. When this property is not used, the uploaded file is created to the root folder of Google Drive.
- `convertToGoogleDocs` : If this property is used as `true`, the uploaded file is converted to Google Docs. But in this case, if the file size is large, an error might occur. Please be careful this. The default value is `false`. So the file is uploaded without converting.
- `fields` : As a sample case, if you want to retrieve only file ID, please use `id`.
- `chunkSize` : If you want to change the chunk size for the resumable upload, please use this. The default value is `52428800` (50 MB). This value is required to be in multiples of 256 KB (256 x 1024 bytes). Please be careful about this. [Ref](https://developers.google.com/drive/api/guides/manage-uploads#uploading)

---

<a name="licence"></a>

# Licence

[MIT](LICENCE)

<a name="author"></a>

# Author

[Tanaike](https://tanaikech.github.io/about/)

If you have any questions and commissions for me, feel free to tell me.

<a name="updatehistory"></a>

# Update History

- v1.0.0 (October 11, 2019)

  1. Initial release.

- v2.0.0 (November 15, 2021)

  1. New Class ResumableUploadToGoogleDrive2 was added. By this, the large file which is over the memory in the local PC can be uploaded by the resumable upload.

- v2.0.1 (April 18, 2023)

  1. From [this discussion](https://github.com/tanaikech/ResumableUploadForGoogleDrive_js/issues/7), checking the inputted custom chunk size was strengthened in the script. And, the following document was added.

	- `chunkSize` : If you want to change the chunk size for the resumable upload, please use this. The default value is `52428800` (50 MB). This value is required to be in multiples of 256 KB (256 x 1024 bytes). Please be careful about this. [Ref](https://developers.google.com/drive/api/guides/manage-uploads#uploading)

[TOP](#top)
