export default function AuthCodeError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-gray-600 mb-6">
          Sorry, we couldn't complete your authentication. This might be due to:
        </p>
        <ul className="text-left text-gray-600 mb-6">
          <li>• An expired or invalid authentication code</li>
          <li>• Network connectivity issues</li>
          <li>• Configuration problems</li>
        </ul>
        <a 
          href="/login" 
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </a>
      </div>
    </div>
  );
}