import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsOfServicePage: React.FC = () => {
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
                Terms of Service
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
                <h2 className="text-xl font-semibold text-purple-300 mb-3">1. Acceptance of Terms</h2>
                <p className="text-gray-300 leading-relaxed">
                  By accessing and using StreamScene ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, you should not use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-purple-300 mb-3">2. Description of Service</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  StreamScene is a project management platform designed for creative professionals and teams. Our services include:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>AI-powered task scheduling and planning tools</li>
                  <li>Project organization and file management</li>
                  <li>Budget tracking and financial management</li>
                  <li>Content scheduling across social media platforms</li>
                  <li>Demo and trailer showcase capabilities</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-purple-300 mb-3">3. User Accounts</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  To access certain features of the Service, you must create an account:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>You must provide accurate and complete information</li>
                  <li>You are responsible for maintaining the security of your account</li>
                  <li>You must notify us immediately of any unauthorized access</li>
                  <li>One person or legal entity may maintain only one account</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-purple-300 mb-3">4. User Content and Conduct</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You retain ownership of content you upload to StreamScene. However, you agree that you will not:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>Upload content that violates any laws or regulations</li>
                  <li>Infringe on intellectual property rights of others</li>
                  <li>Upload malicious code, viruses, or harmful content</li>
                  <li>Use the service to harass, abuse, or harm others</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Use the service for any commercial purpose without permission</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-purple-300 mb-3">5. Intellectual Property</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  StreamScene and its original content, features, and functionality are owned by StreamScene and are protected by copyright, trademark, and other laws.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  You grant StreamScene a limited, non-exclusive license to use your content solely for the purpose of providing the Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-purple-300 mb-3">6. Third-Party Services</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  StreamScene integrates with third-party services including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>Google services for authentication and file storage</li>
                  <li>Social media platforms for content scheduling</li>
                  <li>AWS for secure cloud storage</li>
                  <li>AI services for intelligent features</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mt-4">
                  Your use of these third-party services is subject to their respective terms of service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-purple-300 mb-3">7. Service Availability</h2>
                <p className="text-gray-300 leading-relaxed">
                  While we strive to provide reliable service, StreamScene is provided "as is" without warranties. We do not guarantee that the service will be uninterrupted or error-free. We reserve the right to modify or discontinue the service at any time.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-purple-300 mb-3">8. Privacy and Data</h2>
                <p className="text-gray-300 leading-relaxed">
                  Your privacy is important to us. Please review our Privacy Policy, which explains how we collect, use, and protect your information when you use our Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-purple-300 mb-3">9. Limitation of Liability</h2>
                <p className="text-gray-300 leading-relaxed">
                  In no event shall StreamScene be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business interruption, arising from your use of the Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-purple-300 mb-3">10. Termination</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We may terminate or suspend your account and access to the Service for violations of these Terms. You may also terminate your account at any time by contacting us.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  Upon termination, your right to use the Service will cease immediately, but data retention will be governed by our Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-purple-300 mb-3">11. Changes to Terms</h2>
                <p className="text-gray-300 leading-relaxed">
                  We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or through the Service. Continued use of the Service after changes constitutes acceptance of the new Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-purple-300 mb-3">12. Contact Information</h2>
                <p className="text-gray-300 leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-purple-500/20">
                  <p className="text-purple-300 font-semibold">StreamScene Legal Team</p>
                  <p className="text-gray-300">Email: legal@streamscene.net*</p>
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

export default TermsOfServicePage;