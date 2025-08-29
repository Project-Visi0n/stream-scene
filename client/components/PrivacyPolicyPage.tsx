import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-transparent to-pink-900/10"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"></div>

      {/* Header */}
      <nav className="relative z-20 p-4 sm:p-6 border-b border-gray-800/50">
        <div className="flex items-center space-x-4">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-400 hover:text-purple-400 transition-colors duration-200"
          >
            <span className="text-lg">←</span>
            <span className="text-sm">Back to Home</span>
          </button>
          
          {/* Logo */}
          <div className="flex items-center space-x-3 ml-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-sm" role="img" aria-label="rocket">🚀</span>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              StreamScene
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-gradient-to-br from-slate-800/30 to-gray-900/30 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6 sm:p-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Privacy Policy
              </span>
            </h1>
            <p className="text-gray-400 text-sm">
              Last updated: August 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-invert prose-purple max-w-none">
            <div className="space-y-6 text-gray-300">
              
              <section>
                <h2 className="text-xl font-semibold text-purple-300 mb-3">1. Information We Collect</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  StreamScene collects information you provide directly to us, such as when you create an account, use our services, or contact us for support.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li><strong>Account Information:</strong> Name, email address, and authentication data from Google OAuth</li>
                  <li><strong>Project Data:</strong> Files, tasks, schedules, and other content you create or upload</li>
                  <li><strong>Usage Information:</strong> How you interact with our platform and features</li>
                  <li><strong>Device Information:</strong> Browser type, operating system, and IP address</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-purple-300 mb-3">2. How We Use Your Information</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We use the information we collect to provide, maintain, and improve our services:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>Provide and maintain the StreamScene platform</li>
                  <li>Process your requests and transactions</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Improve our services and develop new features</li>
                  <li>Ensure security and prevent fraud</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-purple-300 mb-3">3. Information Sharing</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following limited circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>With your explicit consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and prevent fraud</li>
                  <li>With trusted service providers who assist in operating our platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-purple-300 mb-3">4. Data Security</h2>
                <p className="text-gray-300 leading-relaxed">
                  We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-purple-300 mb-3">5. Third-Party Services</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  StreamScene integrates with third-party services to enhance functionality:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li><strong>Google OAuth:</strong> For secure authentication</li>
                  <li><strong>AWS S3:</strong> For secure file storage</li>
                  <li><strong>Social Media APIs:</strong> For content scheduling features</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mt-4">
                  These services have their own privacy policies, which we encourage you to review.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-purple-300 mb-3">6. Your Rights</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your information</li>
                  <li>Export your data</li>
                  <li>Withdraw consent for data processing</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-purple-300 mb-3">7. Contact Us</h2>
                <p className="text-gray-300 leading-relaxed">
                  If you have any questions about this Privacy Policy or our data practices, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-purple-500/20">
                  <p className="text-purple-300 font-semibold">StreamScene Privacy Team</p>
                  <p className="text-gray-300">Email: privacy@streamscene.net*</p>
                  <p className="text-gray-300">Website: streamscene.net</p>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;