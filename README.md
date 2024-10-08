# LinkedIn Clone

## Project Overview

This project is a LinkedIn clone built with Angular and Ionic for the frontend, and NestJS for the backend. It demonstrates a wide range of features and best practices in modern web development.

## Features

1. **Authentication**
   - Secure signup and login functionality
   - JWT-based authentication
   - Role-Based Access Control (RBAC)

2. **User Management**
   - User profiles
   - Friend request system

3. **Post Management**
   - Create, read, update, and delete posts
   - Pagination and infinite scrolling
   - Newest-to-oldest post ordering

4. **File Upload**
   - Image upload with MIME type verification
   - File type validation using magic numbers

5. **Chat Application**
   - Real-time messaging using WebSockets

6. **Responsive Design**
   - Mobile-friendly interface

## Tech Stack

- **Frontend**: Angular, Ionic
- **Backend**: NestJS
- **Database**: PostgreSQL
- **Authentication**: Passport, JWT
- **File Handling**: Multer, file-type
- **Real-time Communication**: WebSockets
- **Testing**: Jest, Karma, Jasmine, Cypress

## Getting Started

### Prerequisites

- Node.js and npm
- Docker and Docker Compose
- Ionic CLI

### Running the Application Locally

#### Backend

1. Navigate to the backend directory:
   ```
   cd api
   ```

2. Start the Docker containers for the database:
   ```
   docker-compose up
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Start the NestJS server:
   ```
   npm run start
   ```

The backend should now be running on `http://localhost:3000` (or your configured port).

#### Frontend

1. Navigate to the frontend directory:
   ```
   cd Linkedin
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the Ionic development server:
   ```
   ionic serve
   ```

The frontend should now be accessible at `http://localhost:8100`.

## Testing

This project includes various types of tests:

### Backend Tests

To run backend tests, navigate to the backend directory and use the following commands:

1. Unit Tests:
   ```
   npm run test
   ```

2. Integration Tests:
   ```
   npm run test:e2e
   ```

### Frontend Tests

To run frontend tests, navigate to the frontend directory and use the following commands:

1. Unit Tests:
   ```
   ng test
   ```

2. End-to-End Tests:
   ```
   ng e2e
   ```

## API Documentation

(Include information about your API endpoints or link to Swagger documentation)

## Error Handling

The application implements comprehensive error handling:
- Custom error handling on the backend to prevent server crashes
- Graceful error handling on the frontend with user-friendly toast notifications

## Logging

- Backend logging using Morgan and custom error logging
- (Include any frontend logging if implemented)

## Security Measures

- Bcrypt for password hashing
- JWT for secure authentication
- Role-based authorization
- File upload security with MIME type and magic number verification

## Performance Optimizations

- Pagination for post fetching
- Infinite scrolling for smooth user experience
- (Include any other optimizations you've implemented)

## Future Enhancements

(List any planned features or improvements)

## Contributing

(Include guidelines for contributing to your project, if applicable)

## License

(Include your project's license information)
