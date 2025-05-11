# AI Study Assistant
# By Felix Hallmann, Johnny Wu, Badrish Ananth - AWS CLOUDHACKS + AI@UCI

An intelligent study assistant that helps users learn through interactive Q&A and speech-based feedback. The application uses AWS Bedrock's Claude AI to analyze study materials and provide personalized feedback.

## Features

- **Document Analysis**: Upload study materials (PDF, Word, etc.) for AI processing
- **Question Generation**: AI generates relevant study questions based on the content
- **Speech Interaction**: Users can answer questions verbally
- **Real-time Feedback**: AI provides personalized feedback on responses
- **Secure Authentication**: User authentication via Amazon Cognito
- **Cloud Storage**: Secure file storage using Amazon S3

## Technologies Used

- **Frontend**:
  - React + Vite
  - TypeScript
  - AWS Amplify UI Components
  - AWS Amplify Storage
  - WebSpeechAPI

- **Backend**:
  - AWS Amplify
  - AWS Bedrock (Supposed to be Claude, may be AWS Kendra)
  - Amazon S3 (File Storage)
  - AWS Lambda (Serverless Functions)
  - API Gateway

## Setup Instructions

1. **Prerequisites**:
   - Node.js (v16 or later)
   - AWS Account with Bedrock access
   - AWS CLI configured

2. **Installation**:
   ```bash
   # Clone the repository
   git clone [repository-url]
   cd ai-study-assistant

   # Install dependencies
   npm install

   # Configure AWS Amplify
   npx ampx init
   ```

3. **AWS Configuration**:
   - Set up AWS credentials
   - Configure Bedrock access
   - Create necessary IAM roles and permissions

4. **Environment Setup**:
   ```bash
   # Create .env file with necessary variables
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Development**:
   ```bash
   # Start development server
   npm run dev

   # Build for production
   npm run build
   ```

## How It Works

1. **Document Upload**:
   - User uploads study materials through the web interface
   - Files are stored securely in S3
   - AI processes the content to understand key concepts

2. **Question Generation**:
   - AI analyzes the document content
   - Generates relevant study questions
   - Presents questions to the user

3. **Speech Interaction**:
   - User speaks their answers
   - Speech is converted to text using Web Speech API
   - Text is processed for analysis

4. **Feedback System**:
   - AI evaluates the user's response
   - Provides personalized feedback
   - Suggests areas for improvement

## Team Members

### Felix Hallmann
- **Role**: Fullstack
- **Contributions**:
  - Implemented React components and user interface
  - Integrated AWS Amplify UI components
  - Created speech-to-text interface
  - Set up IAM roles and policies for access control
  - Developed question generator logic

### Johnny Wu
- **Role**: Fullstack MVP 10x Engineer
- **Contributions**:
  - Set up AWS Amplify backend infrastructure
  - Developed question generator logic 
  - Implemented AWS Bedrock integration
  - Developed file upload functionality
  - Developed Lambda functions for AI processing

### Badrish Ananth
- **Role**: AI Integration & Testing
- **Contributions**:
  - Implemented AI question generation logic
  - Developed feedback system using Claude AI (Claude 3.7 Sonnet)
  - Created API Gateway endpoints
  - Optimized AI response handling

## Security

- All user data is encrypted in transit and at rest
- Secure file storage with S3
- IAM roles and policies for access control

## License

This project is licensed under the MIT-0 License. See the LICENSE file for details.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for more information on how to contribute to this project.

## Support

For support, please open an issue in the repository or contact the development team.
