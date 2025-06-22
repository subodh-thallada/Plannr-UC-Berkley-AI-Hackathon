# Welcome to your the project

## Project info

**URL**: https://ai-assist-planner.vercel.app/

## Setup

### Google Gemini API Setup

This project uses Google's Gemini API for the chatbot functionality. To get it working:

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey) to get your API key
2. Create a `.env` file in the root directory
3. Add your API key to the `.env` file:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```
4. Restart your development server

### VAPI API Setup (for venue calling)

This project uses VAPI for automated venue calling. To get it working:

1. **Get your API key**:
   - Visit [VAPI.ai](https://vapi.ai/) to create an account
   - Go to the [VAPI Dashboard](https://dashboard.vapi.ai/)
   - Get your API key from the API Keys section

2. **Create an Assistant**:
   - In the VAPI Dashboard, go to "Assistants" section
   - Click "Create Assistant"
   - Name it "Venue Booking Assistant"
   - Set model to "OpenAI GPT-4"
   - Add this system prompt:
     ```
     You are a helpful assistant calling to book a venue. 
     
     Call the venue at +16479361710 and ask about:
     1. Availability for the event date
     2. Capacity and pricing
     3. Booking requirements and deposit
     4. Any special requirements or restrictions
     
     Be professional, friendly, and gather all necessary information for booking.
     ```
   - Set first message to: "Hi, I'm calling to inquire about booking your venue for an upcoming event. Could you tell me about your availability and pricing?"
   - Choose voice: "Jennifer"
   - Save and copy the Assistant ID

3. **Get a Phone Number**:
   - Go to "Phone Numbers" section
   - Click "Get Phone Number"
   - Choose a number that supports outbound calls
   - Copy the Phone Number ID

4. **Configure environment variables**:
   - Add these to your `.env` file:
     ```
     VITE_VAPI_API_KEY=your_vapi_api_key_here
     VITE_VAPI_ASSISTANT_ID=your_assistant_id_here
     VITE_VAPI_PHONE_NUMBER_ID=your_phone_number_id_here
     ```

5. **Restart your development server**

**Note**: If any of these are not configured, the venue calling feature will show specific error messages asking you to configure the missing values.

### Letta API Setup (for chatbot memory)

This project supports Letta memory for the chatbot, allowing conversations to persist across sessions.

1. **Get your Letta API key**:
   - Sign up at [Letta Cloud](https://letta.com/) and create an API key from your dashboard.
2. **Configure environment variables**:
   - Add this to your `.env` file:
     ```
     VITE_LETTA_API_KEY=your_letta_api_key_here
     ```
3. **Restart your development server**

**How to use Letta memory:**
- In the chat panel, enable the "Letta Memory" toggle to use Letta for persistent memory. When enabled, your chat will be remembered across sessions.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/8b78dba3-32ed-423f-a550-9486cc142d02) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/8b78dba3-32ed-423f-a550-9486cc142d02) and click on Share -> Publish.

## Task Editing Features

This project includes advanced task editing capabilities that allow you to:

### Edit Task Details
- **Inline Editing**: Click the edit icon (✏️) next to any task details to edit them inline
- **Smart Placeholders**: Input fields show helpful examples based on the task type:
  - Timeline: "Enter timeline (e.g., March 15-17, 2024)"
  - Location: "Enter location (e.g., San Francisco Convention Center)"
  - Theme: "Enter theme (e.g., AI and Sustainability)"
  - Size: "Enter size (e.g., 500 participants)"

### Source Tracking
- **AI vs Manual**: Visual indicators show whether details came from the chatbot (🤖) or were manually edited (👤)
- **Clear History**: Use the trash icon (🗑️) to remove task details entirely

### Keyboard Shortcuts
- **Enter**: Save changes
- **Escape**: Cancel editing

### Add Details to Empty Tasks
- Tasks without details show an "Add details" button
- Click to start editing and add information manually

### Branding Colors
- **Color Selection**: Choose primary and secondary colors for your project theme
- **Visual Preview**: See color swatches and hex codes
- **AI Integration**: Chatbot can detect and set colors from hex codes
- **Manual Editing**: Use color pickers to customize your brand colors

### Venue Booking
- **Automated Calling**: Click "Call Venue" to automatically call +16479361710
- **AI Assistant**: VAPI-powered AI handles the conversation professionally
- **Real-time Status**: See call status (calling, connected, ended, error)
- **Task Integration**: Automatically updates task status when call completes

**Note**: Requires VAPI API key in environment variables (`VITE_VAPI_API_KEY`)

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
