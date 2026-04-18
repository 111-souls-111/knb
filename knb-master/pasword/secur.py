from werkzeug.security import generate_password_hash, check_password_hash

def hash_password(password):
    return generate_password_hash(password)

def verify_password(password, password_hash):
    return check_password_hash(password_hash, password)

def validate_credentials(username, password):
    errors = []
    if not username or len(username) < 3:
        errors.append("Имя пользователя должно быть не менее 3 символов")
    if not password or len(password) < 6:
        errors.append("Пароль должен быть не менее 6 символов")
    return errors
