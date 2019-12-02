[![HitCount](http://hits.dwyl.io/triethyl/PC-Stream.svg)](http://hits.dwyl.io/triethyl/PC-Stream)

# PC Stream

An Electron app for a futuristic looking PC Streaming solution

## API Documentation

### 1. /authenticate

```http
POST /api/authenticate

{
    "username":    "username",
    "password":    "password"
}
```
*returns:*
- ✅  `200 OK`
*body* ->  `<json_web_token>` **{user_id}**

- ❌  `400 Bad Request` 
*body* -> `DATA_X`   **username or password not sent**

- ❌ `403 Forbidden`
   - *body* -> `UNAME_X`    **username doesn't exist**
   - *body* -> `PWORD_X`    **wrong password**

### 2. /server-check

```http
GET /api/server-check
```
*returns*:
- ✅  Always `200 OK` if server running with body as `PC Stream, <os_code>`

*types of <os_code>:*
- `win32` - Windows (x32 / x64)
- `linux/macos/etc` - Unix Based

Having information of the os is necessary, so that you can request dirs appropriately.
Also, this open route will help to scan the network to find a host running PC Stream.

### 3. /get-dir

```http
POST /api/get-dir
authorization: Bearer <jsonwebtoken>

{
    "dir": "<dir>"
}
```
*possible values of dir:*
- `/` - Refers to the root directory in macos and linux, while referring to the Local Disks and Drives in Windows
- `any/valid/dir` - Refers to that dir, keep in mind that dir must be absolute

*returns:*
- ✅  `200 OK`
*body* -> `{drives, folders, files, others}`
 ```
 drives: {type, name, size, free, volumename}
    - type = "Local Fixed Disk"/"CD-ROM Disc"/"Removable Disk"/etc
    - name = Drive Letter ("C:")
    - size = Total size in bytes
    - free = Free space in bytes
    - volumename = If any special name is provided to the Disk by the user, then that name.

 folders: []       Array of folder names in the current directory
 files: []            Array of file names in the current directory
 others: []        Array of weirdo files which causes errors when opening or reading the details of
 ```


- ❌ `400 Bad Request`
   - *body* -> `PATH_NOT_ABS`    **Relative paths are not supported. All requested path needs to be absolute, from root/drive letter**
   - *body* -> `DIR_DNE`    **The folder doesn't exist or the user doesn't have permissions to enter. Chill, unallowed dirs won't be returned as a folder when requesting a dir having a folder which is not allowed**

- ❌ `403 Forbidden`
-> **Authorization Header not present/Wrong Authorization Header/Session Timed Out**

- ❌ `500 Server Error`
*body* -> `SERVER_ERR`    **Some error occurred while opening the folder**

### 4. /get-user-data

```http
POST /api/get-user-data
authorization: Bearer <jsonwebtoken>
```

*returns:*
- ✅  `200 OK` *body* ->  `{base64DP, name}`
```
base64DP: String, containing the Base 64 Encoded Profile Picture of Logged in user.
name:     String, containing the Real Name of the user.
```

- ❌ `403 Forbidden`
-> **Authorization Header not present/Wrong Authorization Header/Session Timed Out**


### 5. /get-file-info

```http
POST /api/get-file-info
authorization: Bearer <jsonwebtoken>

{
    "file": "absolute/dir/to/file"
}
```

*returns:*
- ✅  `200 OK` *body* ->  `{file_size, last_modified, is_streamable, type, duration}`
```
file_size:     Number, File Size in Bytes
last_modified: Time (String), Last Modified Time
is_streamable: Boolean, If it can be streamed or not
*type:          Enum { "audio", "video" } 
*duration:      Numeric, Number of seconds of size of the file

*only for streamable
```

- ❌ `400 Bad Request`
   - *body* -> `FILE_DNE`    **The file doesn't exist or the user doesn't have permissions to see in it**
   - *body* -> `PATH_NOT_ABS`    **Relative paths are not supported. All requested path needs to be absolute, from root/drive letter**

- ❌ `403 Forbidden`
-> **Authorization Header not present/Wrong Authorization Header/Session Timed Out**

### 6. /get-stream

```http
POST /api/get-stream
authorization: Bearer <jsonwebtoken>

{
   "file": "absolute/path/to/file/"
}
```

*returns:*
- ✅  `200 OK` *body* ->  `{token}`
```
token:     String, token to stream the file with, used in /api/stream
```

- ❌ `400 Bad Request`
   - *body* -> `DATA_X`    **A file was not requested for**
   - *body* -> `CANT_DL_STREAM`    **You don't have download and streaming permissions**
   - *body* -> `PATH_NOT_ABS`    **Relative paths are not supported. All requested path needs to be absolute, from root/drive letter**
   - *body* -> `DIR_DNE`    **The folder doesn't exist or the user doesn't have permissions to enter**

- ❌ `403 Forbidden`
-> **Authorization Header not present/Wrong Authorization Header/Session Timed Out**

- ❌ `500 Server Error`
-> **A proper token couldn't be created, retry**

### 7. /stream

```http
GET /stream?token=<stream-token>
```

To stream or download, first a **token** is required. The token can be received using the path `/api/get-stream`.
This is done so that it can be easily used in the following manner:
```html
   <video src="/stream?token=<stream-token>" controls>
```

*returns:*
- ✅  `200 OK` *body* ->  A buffer containing the stream

- ❌ `400 Bad Request`
   - *body* -> `DATA_X`    **A token wasn't sent**
   - *body* -> `TOKEN_X`    **An invalid token was sent**


### 8. /delete

```http
POST /api/delete
authorization: Bearer <jsonwebtoken>

{
   "file": "absolute/path/to/file"
}
```

*returns:*
- ✅  `200 OK` **The file was deleted successfully**

- ❌ `400 Bad Request`
   - *body* -> `DATA_X`    **A file wasn't sent**
   - *body* -> `CANT_DX`    **No permissions to delete was given to you**
   - *body* -> `PATH_NOT_ABS`    **Given file path wasn't absolute**
   - *body* -> `DIR_CANT`    **Can't delete directories**
   - *body* -> `FILE_DNE`    **The file doesn't exist or the user doesn't have permissions to access that folder in which the file is present**

- ❌ `403 Forbidden`
-> **Authorization Header not present/Wrong Authorization Header/Session Timed Out**

- ❌ `500 Server Error`
-> **The file couldn't be deleted due to some issue on server or maybe the file wasn't accessible**

### 9. /rename

```http
POST /api/rename
authorization: Bearer <jsonwebtoken>

{
   "from_name": "absolute/path/to/file/or/dir",
   "to_name": "absolute/path/to/file/or/dir"
}
```

*returns:*
- ✅  `200 OK` **The file was renamed successfully**

- ❌ `400 Bad Request`
   - *body* -> `DATA_X`    **From and To Names weren't sent**
   - *body* -> `CANT_RN`    **No permissions to rename was given to you**
   - *body* -> `PATH_NOT_ABS`    **Given file path wasn't absolute of either From or To**
   - *body* -> `FILE_DNE`    **The file doesn't exist or the user doesn't have permissions to access that folder in which the file is present**

- ❌ `403 Forbidden`
-> **Authorization Header not present/Wrong Authorization Header/Session Timed Out**

- ❌ `500 Server Error`
*body* -> `{syscall error}`
-> **The file couldn't be reanamed due to some issue on server or maybe the file wasn't accessible**

### 10. /recur-media-scan

```http
POST /api/recur-media-scan
authorization: Bearer <jsonwebtoken>

{
   "dir": "dir/to/scan/recursively/under"
}
```

*returns:*
- ✅  `200 OK` *body* -> `{ media }`
```
media:   Array of absolute paths of streamable files, accessible to current user
```

- ❌ `400 Bad Request`
   - *body* -> `DATA_X`    **Directory was not sent**
   - *body* -> `PATH_NOT_ABS` **Directory path sent wasn't absolute**
   - *body* -> `DIR_DNE`   **Given directory does not exist**
   - *body* -> `DIR_X`  **Not a directory**

- ❌ `403 Forbidden`
-> **Authorization Header not present/Wrong Authorization Header/Session Timed Out**

- ❌ `500 Server Error`
-> **Error is scanning directories**

### 11. /update-watching

```http
POST /api/update-watching
authorization: Bearer <jsonwebtoken>

{
   "file": "absolute/path/to/file/getting/streamed",
   "seen_till": Number 0-100
}
```

*returns:*
- ✅  `200 OK` (If updated)

- ❌ `400 Bad Request`
   - *body* -> `DATA_X`    **File/Seen Till was not sent**
   - *body* -> `PATH_NOT_ABS` **Directory path sent wasn't absolute**

- ❌ `403 Forbidden`
   -> **Authorization Header not present/Wrong Authorization Header/Session Timed Out**

### 12. /get-video-thumbnail

```http
POST /api/get-video-thumbnail
authorization: Bearer <jsonwebtoken>

{
   "file": "absolute/path/to/streamable/video/file",
   "at": Number 0-duration
}
```

*returns:*
- ✅  `200 OK` *body* -> `{thumbnail}`
```
thumbnail:  Base64 encoded thumbnail
```

- ❌ `400 Bad Request`
   - *body* -> `DATA_X` **File/At was not sent**
   - *body* -> `PATH_NOT_ABS` **File path sent wasn't absolute**
   - *body* -> `FILE_DNE` **File does not exist**
   - *body* -> `NOT_VID` **Sent file was not a video and hence, a thumbnail can't be made**


- ❌ `403 Forbidden`
   -> **Authorization Header not present/Wrong Authorization Header/Session Timed Out**