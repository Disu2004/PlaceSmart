import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const gemini_model = "gemini-2.5-flash"
// Controller for generating interview questions (supports both GET and POST)
export const generateInterviewQuestions = async (req, res) => {
    try {
        // Support both GET (query params) and POST (body) requests
        let { interviewType, domain, questionCount = 2 } = req.method === 'GET' ? req.query : req.body;
        questionCount = 2;
        console.log('Generating questions:', { interviewType, domain, questionCount });

        // Validation
        if (!interviewType || !domain) {
            return res.status(400).json({
                success: false,
                message: "Interview type and domain are required"
            });
        }

        // Check if API key exists
        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY not found in environment variables');
            return res.status(500).json({
                success: false,
                message: "GEMINI_API_KEY is not configured"
            });
        }

        const model = genAI.getGenerativeModel({ model: gemini_model });

        // Create prompt based on interview type
        let prompt = "";
        
        if (interviewType === "hr") {
            prompt = `You are an experienced HR interviewer. Generate ${questionCount} professional interview questions for a ${domain} position.

Instructions:
- Focus on behavioral questions using the STAR method
- Include questions about teamwork, leadership, conflict resolution
- Ask about cultural fit and work style
- Include scenario-based questions
- Questions should assess soft skills and interpersonal abilities

Format your response as a JSON array with this structure:
[
    {
        "questionNumber": 1,
        "question": "The actual question text",
        "category": "Behavioral/Leadership/Teamwork/etc",
        "expectedAnswer": "Brief guideline of what a good answer should cover"
    }
]

Generate exactly ${questionCount} questions. Return ONLY the JSON array, no additional text.`;
        } else {
            prompt = `You are an expert technical interviewer specializing in ${domain}. Generate ${questionCount} technical interview questions.

Instructions:
- Include questions ranging from fundamental concepts to advanced topics
- Cover practical problem-solving scenarios
- Include questions about best practices and methodologies
- Add at least one coding/design challenge if applicable
- Questions should assess deep technical understanding

Format your response as a JSON array with this structure:
[
    {
        "questionNumber": 1,
        "question": "The actual question text",
        "category": "Fundamentals/Advanced/Problem-Solving/System Design/etc",
        "expectedAnswer": "Brief guideline of key points a strong answer should cover",
        "difficulty": "Easy/Medium/Hard"
    }
]

Generate exactly ${questionCount} questions for ${domain}. Return ONLY the JSON array, no additional text.`;
        }

        // Generate questions
        console.log('Calling Gemini API...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let questionsText = response.text();

        console.log('Received response from Gemini');

        // Clean up the response (remove markdown code blocks if present)
        questionsText = questionsText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Parse questions
        const questions = JSON.parse(questionsText);
        
        console.log(`Successfully generated ${questions.length} questions`);
        return res.status(200).json({
            success: true,
            interviewType,
            domain,
            questions,
            totalQuestions: questions.length
        });

    } catch (error) {
        console.error("Error generating questions:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate interview questions",
            error: error.message
        });
    }
};

// Controller for asking follow-up questions during interview
export const getFollowUpQuestion = async (req, res) => {
    try {
        const { interviewType, domain, conversationHistory, currentAnswer } = req.body;

        // Validation
        if (!interviewType || !domain || !currentAnswer) {
            return res.status(400).json({
                success: false,
                message: "Interview type, domain, and current answer are required"
            });
        }

        const model = genAI.getGenerativeModel({ model:gemini_model});

        let prompt = "";

        if (interviewType === "hr") {
            prompt = `You are an HR interviewer for a ${domain} position. 

Previous conversation:
${conversationHistory || "This is the first question"}

The candidate just answered: "${currentAnswer}"

Based on their answer, generate ONE insightful follow-up question that:
- Probes deeper into their experience
- Explores specific examples or situations
- Assesses their problem-solving or interpersonal skills
- Is natural and conversational

Return ONLY the follow-up question text, nothing else.`;
        } else {
            prompt = `You are a technical interviewer for ${domain}.

Previous conversation:
${conversationHistory || "This is the first question"}

The candidate just answered: "${currentAnswer}"

Based on their answer, generate ONE technical follow-up question that:
- Tests deeper understanding of concepts they mentioned
- Explores edge cases or advanced scenarios
- Challenges their technical reasoning
- Is relevant to ${domain}

Return ONLY the follow-up question text, nothing else.`;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const followUpQuestion = response.text().trim();

        return res.status(200).json({
            success: true,
            followUpQuestion
        });

    } catch (error) {
        console.error("Error generating follow-up:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate follow-up question",
            error: error.message
        });
    }
};

// Controller for reviewing interview responses
export const reviewInterviewResponse = async (req, res) => {
    try {
        const { 
            interviewType, 
            domain, 
            question, 
            answer, 
            questionCategory 
        } = req.body;

        // Validation
        if (!interviewType || !domain || !question || !answer) {
            return res.status(400).json({
                success: false,
                message: "Interview type, domain, question, and answer are required"
            });
        }

        const model = genAI.getGenerativeModel({ model: gemini_model });

        let prompt = "";

        if (interviewType === "hr") {
            prompt = `You are an expert HR interview evaluator for ${domain} positions.

Question Asked: "${question}"
Category: ${questionCategory || "General"}
Candidate's Answer: "${answer}"

Evaluate this answer and provide detailed feedback in the following JSON format:
{
    "score": <number from 1-10>,
    "strengths": ["strength 1", "strength 2", "..."],
    "weaknesses": ["weakness 1", "weakness 2", "..."],
    "suggestions": ["suggestion 1", "suggestion 2", "..."],
    "overallFeedback": "A comprehensive paragraph summarizing the evaluation",
    "missedPoints": ["important point 1", "important point 2", "..."],
    "rating": "Excellent/Good/Average/Needs Improvement"
}

Evaluation criteria:
- Use of STAR method (Situation, Task, Action, Result)
- Specific examples and concrete details
- Demonstration of relevant soft skills
- Communication clarity
- Self-awareness and learning from experiences

Return ONLY the JSON object, no additional text.`;
        } else {
            prompt = `You are an expert technical interview evaluator for ${domain}.

Question Asked: "${question}"
Category: ${questionCategory || "Technical"}
Candidate's Answer: "${answer}"

Evaluate this technical answer and provide detailed feedback in the following JSON format:
{
    "score": <number from 1-10>,
    "technicalAccuracy": <number from 1-10>,
    "strengths": ["strength 1", "strength 2", "..."],
    "weaknesses": ["weakness 1", "weakness 2", "..."],
    "suggestions": ["suggestion 1", "suggestion 2", "..."],
    "overallFeedback": "A comprehensive paragraph summarizing the evaluation",
    "missedConcepts": ["concept 1", "concept 2", "..."],
    "depthOfKnowledge": "Expert/Advanced/Intermediate/Beginner",
    "rating": "Excellent/Good/Average/Needs Improvement"
}

Evaluation criteria for ${domain}:
- Technical accuracy and correctness
- Depth of understanding
- Best practices and industry standards
- Problem-solving approach
- Code quality (if applicable)
- Consideration of edge cases and scalability

Return ONLY the JSON object, no additional text.`;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let reviewText = response.text();

        // Clean up the response
        reviewText = reviewText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const review = JSON.parse(reviewText);

        return res.status(200).json({
            success: true,
            question,
            answer,
            review
        });

    } catch (error) {
        console.error("Error reviewing response:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to review interview response",
            error: error.message
        });
    }
};

// Controller for complete interview evaluation
export const evaluateCompleteInterview = async (req, res) => {
    try {
        const { 
            interviewType, 
            domain, 
            questionsAndAnswers, 
            duration 
        } = req.body;

        console.log('=== Evaluate Complete Interview ===');
        console.log('Interview Type:', interviewType);
        console.log('Domain:', domain);
        console.log('Questions Count:', questionsAndAnswers?.length);
        console.log('Duration:', duration);

        // Validation
        if (!interviewType || !domain || !questionsAndAnswers || !Array.isArray(questionsAndAnswers)) {
            console.error('Validation failed:', { interviewType, domain, questionsAndAnswers });
            return res.status(400).json({
                success: false,
                message: "Interview type, domain, and questions-answers array are required"
            });
        }

        if (questionsAndAnswers.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No questions and answers provided"
            });
        }

        // Check API key
        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY not configured');
            return res.status(500).json({
                success: false,
                message: "GEMINI_API_KEY is not configured"
            });
        }

        const model = genAI.getGenerativeModel({ 
            model: gemini_model,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            }
        });

        // Format Q&A for the prompt
        const formattedQA = questionsAndAnswers.map((qa, index) => 
            `Q${index + 1} [${qa.category || 'General'}]: ${qa.question}\nA${index + 1}: ${qa.answer}`
        ).join('\n\n');

        console.log('Formatted Q&A length:', formattedQA.length);

        let prompt = "";

        if (interviewType === "hr") {
            prompt = `You are a senior HR manager evaluating a complete interview for a ${domain} position.

Interview Duration: ${duration || 'N/A'}

Complete Interview Transcript:
${formattedQA}

Provide a comprehensive evaluation in the following JSON format:
{
    "overallScore": 7,
    "categoryScores": {
        "communication": 7,
        "culturalFit": 8,
        "experience": 6,
        "problemSolving": 7,
        "leadership": 6
    },
    "strengths": ["Clear communication", "Good examples"],
    "areasForImprovement": ["More specific details needed"],
    "keyTakeaways": ["Shows potential"],
    "hiringRecommendation": "Hire",
    "detailedFeedback": "The candidate demonstrated solid communication skills and provided relevant examples. There is room for improvement in providing more specific details about past experiences.",
    "nextSteps": ["Schedule technical round", "Check references"]
}

Return ONLY the JSON object, no additional text or markdown.`;
        } else {
            prompt = `You are a senior technical interviewer evaluating a complete ${domain} interview.

Interview Duration: ${duration || 'N/A'}

Complete Interview Transcript:
${formattedQA}

Provide a comprehensive technical evaluation in the following JSON format:
{
    "overallScore": 7,
    "categoryScores": {
        "technicalKnowledge": 7,
        "problemSolving": 8,
        "codeQuality": 7,
        "systemDesign": 6,
        "communication": 7
    },
    "technicalLevel": "Mid-Level",
    "strengths": ["Strong problem-solving", "Good coding practices"],
    "areasForImprovement": ["System design depth"],
    "knowledgeGaps": ["Advanced algorithms"],
    "hiringRecommendation": "Hire",
    "detailedFeedback": "The candidate showed strong technical skills with good problem-solving abilities. Their code quality is solid, though system design knowledge could be deeper.",
    "technicalRecommendations": ["Practice system design", "Study distributed systems"]
}

Return ONLY the JSON object, no additional text or markdown.`;
        }

        console.log('Sending request to Gemini API...');

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let evaluationText = response.text();

        console.log('Received response from Gemini');
        console.log('Raw response length:', evaluationText.length);

        // Clean up the response - remove markdown and extra whitespace
        evaluationText = evaluationText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .replace(/^[\s\n]+|[\s\n]+$/g, '')
            .trim();

        console.log('Cleaned response:', evaluationText.substring(0, 200) + '...');

        // Try to parse JSON
        let evaluation;
        try {
            evaluation = JSON.parse(evaluationText);
            console.log('Successfully parsed evaluation');
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Failed to parse:', evaluationText.substring(0, 500));
            
            return res.status(500).json({
                success: false,
                message: "Failed to parse evaluation response",
            });
        }

        console.log('Sending response to client');

        return res.status(200).json({
            success: true,
            interviewType,
            domain,
            totalQuestions: questionsAndAnswers.length,
            evaluation
        });

    } catch (error) {
        console.error("=== Error evaluating interview ===");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        
        return res.status(500).json({
            success: false,
            message: "Failed to evaluate complete interview",
            error: error.message,
            details: error.toString()
        });
    }
};