FROM python:3.13.0-slim-bookworm

# Set the working directory
WORKDIR /app

# Copy the requirements file into the container and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the project into the container
COPY . .

# Expose the application port
EXPOSE 8000

# Run the application
CMD ["python", "-m", "app.main"]
