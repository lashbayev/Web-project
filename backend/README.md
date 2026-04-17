# NoBroke Backend

## Run locally

```bash
cd backend
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver
```

API base URL: `http://127.0.0.1:8000/api/`

## Demo accounts

- Employer: `employer@example.com` / `pass1234`
- Student: `student@example.com` / `pass1234`

## Main endpoints

- `POST /api/login/`
- `POST /api/logout/`
- `GET, POST /api/projects/`
- `GET, PUT, PATCH, DELETE /api/projects/<id>/`
- `GET, PATCH /api/profile/`
- `GET, POST /api/applications/`
- `PATCH /api/applications/<id>/`

## Notes

- Authentication uses DRF token auth with the `Bearer` prefix to match the Angular interceptor.
- CORS allows the Angular dev server on `http://localhost:4200` and `http://127.0.0.1:4200`.
- Postman collection is stored in `backend/postman_collection.json`.
