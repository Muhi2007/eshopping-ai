import React, { useState } from 'react';

// Main App component
const App = () => {
    // State variables for inputs and recommendations
    const [productLink, setProductLink] = useState('');
    const [numRecommendations, setNumRecommendations] = useState(3);
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    /**
     * Handles the generation of recommendations.
     * It sends a prompt to the Gemini API to get simulated product suggestions.
     */
    const generateRecommendations = async () => {
        // Clear previous recommendations and errors
        setRecommendations([]);
        setError('');
        setIsLoading(true);

        // Basic validation for product link
        if (!productLink.trim()) {
            setError('Please enter a product link.');
            setIsLoading(false);
            return;
        }

        // Determine a placeholder product type if the link is generic, or infer from link if possible
        // For a more robust app, you might parse the link to get a hint
        const inferredProductType = productLink.toLowerCase().includes('shirt') ? 'shirt' :
                                    productLink.toLowerCase().includes('dress') ? 'dress' :
                                    productLink.toLowerCase().includes('shoe') ? 'shoe' :
                                    'clothing item'; // Default guess

        const complementaryProductType = inferredProductType === 'shirt' ? 'trousers or skirts' :
                                         inferredProductType === 'dress' ? 'jackets or accessories' :
                                         inferredProductType === 'shoe' ? 'socks or shoe care products' :
                                         'matching outfits or accessories';

        // Construct the prompt for the Gemini API
        const prompt = `Given a product link (e.g., "${productLink}") which is a ${inferredProductType}, please suggest exactly ${numRecommendations} relevant and modern ${complementaryProductType} that would fit well with it. For each suggestion, provide a product name, a realistic price (e.g., "$XX.XX"), a short, positive review snippet, and a dummy product link (e.g., "https://example.com/product-recommendation-1").
                        Format the output as a JSON array of objects. Each object should have 'name' (string), 'price' (string), 'review' (string), and 'link' (string) properties.
                        Example JSON structure:
                        [
                          {"name": "...", "price": "...", "review": "...", "link": "..."},
                          {"name": "...", "price": "...", "review": "...", "link": "..."}
                        ]`;

        try {
            // Define the payload for the Gemini API call
            const payload = {
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json", // Request JSON output
                    responseSchema: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                "name": { "type": "STRING" },
                                "price": { "type": "STRING" },
                                "review": { "type": "STRING" },
                                "link": { "type": "STRING" }
                            },
                            "propertyOrdering": ["name", "price", "review", "link"]
                        }
                    }
                }
            };

            // Gemini API key - left empty as Canvas provides it at runtime
            const apiKey = "AIzaSyC_jxCqffc-o8uKEQnNcgOXUL7pK1R9qVo";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            // Make the API call
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Check if the response was successful
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API error: ${errorData.error.message || response.statusText}`);
            }

            const result = await response.json();

            // Process the API response
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const jsonText = result.candidates[0].content.parts[0].text;
                try {
                    const parsedRecommendations = JSON.parse(jsonText);
                    setRecommendations(parsedRecommendations);
                } catch (jsonError) {
                    setError('Failed to parse recommendations from AI. Please try again.');
                    console.error('JSON parsing error:', jsonError);
                }
            } else {
                setError('No recommendations received from AI. Please try again.');
            }
        } catch (err) {
            setError(`Failed to fetch recommendations: ${err.message}`);
            console.error('Recommendation generation error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans antialiased">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">E-Shopping AI Tool</h1>

                {/* Input Section */}
                <div className="mb-6 space-y-4">
                    <div>
                        <label htmlFor="productLink" className="block text-gray-700 text-sm font-semibold mb-2">
                            Product Link (e.g., a shirt link)
                        </label>
                        <input
                            type="url"
                            id="productLink"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                            placeholder="e.g., https://example.com/stylish-blue-shirt"
                            value={productLink}
                            onChange={(e) => setProductLink(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="numRecommendations" className="block text-gray-700 text-sm font-semibold mb-2">
                            Number of Recommendations
                        </label>
                        <input
                            type="number"
                            id="numRecommendations"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                            min="1"
                            max="10"
                            value={numRecommendations}
                            onChange={(e) => setNumRecommendations(Number(e.target.value))}
                        />
                    </div>
                    <button
                        onClick={generateRecommendations}
                        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                            </>
                        ) : (
                            'Generate Recommendations'
                        )}
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6" role="alert">
                        <strong className="font-bold">Error:</strong>
                        <span className="block sm:inline ml-2">{error}</span>
                    </div>
                )}

                {/* Recommendations Display */}
                {recommendations.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Recommended Products</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {recommendations.map((rec, index) => (
                                <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-md p-5 transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{rec.name}</h3>
                                    <p className="text-blue-600 font-bold mb-1">{rec.price}</p>
                                    <p className="text-gray-700 text-sm mb-3">"{rec.review}"</p>
                                    <a
                                        href={rec.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline text-sm"
                                    >
                                        View Product
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {/* Tailwind CSS CDN */}
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                body {
                    font-family: 'Inter', sans-serif;
                }
                `}
            </style>
        </div>
    );
};

export default App;
