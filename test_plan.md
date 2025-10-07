# Admin Login Error Management Test Plan

This document outlines the test plan for the improved error management features on the admin login page.

## Test Cases

### 1. Invalid Credentials

*   **Action**: Attempt to log in with an incorrect email and password.
*   **Expected Result**: The message "Invalid email or password." should be displayed.

### 2. User Not Found

*   **Action**: Attempt to log in with an email that is not registered.
*   **Expected Result**: The message "Invalid email or password." should be displayed.

### 3. Forgot Password with Non-Existing User

*   **Action**: Enter a non-registered email and click "Forgot password?".
*   **Expected Result**: The message "User with this email does not exist." should be displayed.

### 4. Forgot Password with Existing User

*   **Action**: Enter a registered email and click "Forgot password?".
*   **Expected Result**: The message "Password reset email sent. Check your inbox." should be displayed.

### 5. Successful Login

*   **Action**: Log in with valid credentials.
*   **Expected Result**: The user should be redirected to `admin.html`.
