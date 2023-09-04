import * as React from 'react';

export const navigationRef = React.createRef();

export function navigate(name, params) {
    navigationRef.current?.navigate(name, params);
}

export const getCurrentRoute = () => {
    return navigationRef.current.getCurrentRoute().name;
}