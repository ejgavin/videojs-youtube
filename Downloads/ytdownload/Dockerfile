# Step 1: Use the official Node.js image
FROM node:16

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Install yt-dlp
RUN apt-get update && \
    apt-get install -y python3-pip && \
    pip3 install yt-dlp

# Step 4: Install necessary dependencies (express)
COPY package.json package-lock.json ./
RUN npm install

# Step 5: Copy the backend and frontend code into the container
COPY . .

# Step 6: Expose the port the app will run on
EXPOSE 3000

# Step 7: Command to run the app
CMD ["node", "server.js"]
