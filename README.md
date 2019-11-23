# PC Stream

An Electron app for a futuristic looking PC Streaming solution

## API Documentation

### 1. /authenticate

```http
POST /authenticate

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

### 2. /servercheck

```http
GET /servercheck
```
*returns*:
- ✅  Always `200 OK` if server running with body as `PC Stream, <os_code>`

*types of <os_code>:*
- `win32` - Windows (x32 / x64)
- `linux/macos/etc` - Unix Based

**Having information of the os is necessary, so that you can request dirs appropriately.**
**Also, this open route will help to scan the network to find a host running PC Stream.**

### 3. /getdir

```http
POST /getdir
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
   - *body* -> `DIR_DNE`    **The folder doesn't exist or the user doesn't have permissions to enter. Chill, unallowed dirs won't be returned as a folder when requesting a dir having a folder which is not allowed**
   - *body* -> `PATH_NOT_ABS`    **Relative paths are not supported. All requested path needs to be absolute, from root/drive letter**

- ❌ `403 Forbidden`
-> **Authorization Header not present/Wrong Authorization Header/Session Timed Out**

- ❌ `500 Server Error`
*body* -> `SERVER_ERR`    **Some error occurred while opening the folder**

### 4. /getPicture

```http
POST /getPicture
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

