# OpenAI Content Moderation Setup

## Environment Variables

Create a `.env` file in the backend directory with the following content:

```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

## Getting an OpenAI API Key

1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key and add it to your `.env` file

## Installation

Run the following command to install required dependencies:

```bash
npm install
```

## Usage

The system will automatically analyze donation messages for inappropriate content before saving them to the database.

- Messages are analyzed using OpenAI's GPT-3.5-turbo model
- If inappropriate content is detected, users will see a warning
- Users can choose to revise their message or proceed anyway
- The server will reject inappropriate messages unless forced submission is used

## API Endpoints

- `POST /api/validate-message` - Validate message content
- `POST /api/donations` - Create donation (with content validation)
