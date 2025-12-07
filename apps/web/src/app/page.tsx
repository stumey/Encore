import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home',
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-6xl font-bold text-gray-900">
          Welcome to <span className="text-purple-600">Encore</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          AI-Powered Concert Memory App
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/auth/signin"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Get Started
          </a>
          <a
            href="/about"
            className="px-6 py-3 bg-white text-purple-600 border-2 border-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
          >
            Learn More
          </a>
        </div>
      </div>
    </main>
  );
}
