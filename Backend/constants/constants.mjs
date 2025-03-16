const ROLES = {
    STUDENT: "student",
    TEACHER: "teacher",
    HOD: "hod",
    ADMIN: "admin",
  };
  
  const ROLE_LIST = Object.values(ROLES);
  
  const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  };
  
  const MESSAGES = {
    SUCCESS: "Operation successful.",
    USER_NOT_FOUND: "User not found.",
    UNAUTHORIZED: "You are not authorized to perform this action.",
    FORBIDDEN: "Access denied.",
    INVALID_INPUT: "Invalid input provided.",
    SERVER_ERROR: "Something went wrong, please try again later.",
  };
  
  const AUTH = {
    ACCESS_TOKEN_EXPIRY: "1h",
    REFRESH_TOKEN_EXPIRY: "7d",
  };
  
  const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  };
  
  const QUIZ_SETTINGS = {
    DEFAULT_TIME_LIMIT: 30, // in minutes
    DEFAULT_PASSING_SCORE: 40, // percentage
    MAX_QUESTIONS_PER_QUIZ: 100,
  };
  
  const UPLOADS = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FILE_TYPES: ["image/jpeg", "image/png", "application/pdf"],
  };
  
  const ENV = {
    DEV: "development",
    PROD: "production",
    TEST: "test",
  };

  export const REGEX = {
    EMAIL: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
    PHONE: /^\d{10}$/, // Ensures exactly 10 digits (Indian phone numbers)
  };
  
  
  export {
    ROLES,
    ROLE_LIST,
    HTTP_STATUS,
    MESSAGES,
    AUTH,
    PAGINATION,
    QUIZ_SETTINGS,
    UPLOADS,
    ENV
  };
  