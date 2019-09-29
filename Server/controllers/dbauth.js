const { check_uname_conflict_and_add, user_list_update, display_user_perms, edit_user_perms, edit_user_password,
    delete_user } = require('./dbconnectors/users')
exports.check_uname_conflict_and_add = check_uname_conflict_and_add
exports.user_list_update = user_list_update
exports.display_user_perms = display_user_perms
exports.edit_user_perms = edit_user_perms
exports.edit_user_password = edit_user_password
exports.delete_user = delete_user