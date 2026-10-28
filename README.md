# student-dashboard

A React + Vite dashboard for managing students, courses, attendance, and examination results.

## Features

- Secure login using the existing student API JWT auth
- Student directory with search and add/edit support
- Course management dashboard
- Attendance tracking by student and course
- Results and grade management
- Responsive admin-friendly UI

## Tech stack

- React
- Vite
- React Router
- Axios
- Vanilla CSS

## Requirements

- Node.js 18+
- The API from `josephfrancis94/student-api` running locally on `http://localhost:5000`

## Setup

1. Install dependencies:
   `npm install`
2. Start the app:
   `npm run dev`
3. Open the local Vite URL shown in the terminal.

## Environment

Create a `.env` file in the root of this project:

```env
VITE_API_URL=http://localhost:5000/api
```

## API integration

This app expects the backend to be available at `http://localhost:5000/api` and uses the following endpoints:

- `POST /auth/login`
- `GET /students`
- `POST /students`
- `PUT /students/:id`
- `DELETE /students/:id`
- `GET /courses`
- `POST /courses`
- `PUT /courses/:id`
- `DELETE /courses/:id`
- `GET /attendance`
- `POST /attendance`
- `PUT /attendance/:id`
- `DELETE /attendance/:id`
- `GET /results`
- `POST /results`
- `PUT /results/:id`
- `DELETE /results/:id`
