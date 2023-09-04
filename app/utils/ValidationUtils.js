export const isEmailValid = (email) => {
    var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email);
}

export const isPasswordValid = (password) => {
    var regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,50})/;
    return regex.test(password);
}

export const isEmptyOrNull = (value) => {
    if (value === undefined) {
        return true;
    } else if (value == null) {
        return true;
    } else if (value == "") {
        return true;
    }
    return false;
}
