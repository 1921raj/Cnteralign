# AI Form Builder with Context Memory

A full-stack web application that allows users to generate dynamic, shareable forms using an LLM (Gemini), track submissions, and support image uploads. The system includes a context-aware memory retrieval system using Pinecone to ensure the AI understands a user's past form history.

## Features

- **Authentication**: Email/password login.
- **AI Form Generation**: Convert natural language prompts to JSON form schemas using Google Gemini.
- **Context Memory**: Uses Pinecone vector database to retrieve relevant past forms to inform new form generation, handling thousands of past records efficiently.
- **Dynamic Rendering**: Forms are rendered from JSON schemas on public shareable links.
- **Image Uploads**: Integrated with Cloudinary for file uploads in forms.
- **Dashboard**: Manage forms and view submissions.

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: MongoDB (Data), Pinecone (Vector Memory)
- **AI**: Google Gemini API
- **Storage**: Cloudinary

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB Atlas account
- Google Cloud Console account (for Gemini API)
- Pinecone account
- Cloudinary account

### 1. Clone the repository
```bash
git clone <repo-url>
cd centralign-ai-form-builder
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory with the following keys:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=your_pinecone_index_name
```

Start the server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## Architecture: Context Memory Retrieval

To handle thousands of past forms without exceeding LLM context limits, we implemented a RAG (Retrieval-Augmented Generation) system:

1.  **Storage**: When a form is created, we generate a vector embedding of its purpose/schema using Gemini's `embedding-001` model and store it in Pinecone with metadata.
2.  **Retrieval**: When a user requests a new form, we generate an embedding for their prompt.
3.  **Search**: We query Pinecone for the top-5 most semantically similar forms belonging to that user.
4.  **Generation**: We pass only these relevant past forms (schema summaries) to the Gemini LLM as context, allowing it to mimic the user's preferred style and fields.

## Scalability

- **Vector Search**: Pinecone handles millions of vectors efficiently, allowing the system to scale to any number of past forms.
- **Context Window**: By retrieving only the top-K relevant forms, we keep the prompt size small and constant, regardless of total history size.
- **Database**: MongoDB handles the structured data (submissions, full schemas) separately from the vector search.

## Limitations

- **Mock Data**: If API keys are missing, the system falls back to mock generation.
- **Schema Complexity**: Very complex validation logic might need manual adjustment in the generated schema.

## Future Improvements

- **Edit Mode**: Allow users to manually edit the generated schema before saving.
- **Analytics**: Visual charts for form submissions.
- **Multi-page Forms**: Support for wizard-style forms.
