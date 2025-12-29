import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Encore - How we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-8">
          Privacy Policy
        </h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to Encore (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal
              information and your right to privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our mobile application and website
              (collectively, the &quot;Services&quot;).
            </p>
            <p className="text-gray-700 leading-relaxed">
              Please read this privacy policy carefully. If you do not agree with the terms of this
              privacy policy, please do not access the Services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Information You Provide</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect information that you voluntarily provide when using our Services:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li><strong>Account Information:</strong> Email address, name, and password when you create an account</li>
              <li><strong>Concert Photos:</strong> Images you upload to our service for AI analysis</li>
              <li><strong>Profile Information:</strong> Optional profile details, preferences, and settings</li>
              <li><strong>Payment Information:</strong> Billing details for premium subscriptions (processed securely through our payment provider)</li>
              <li><strong>Communications:</strong> Messages you send to customer support</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Information Collected Automatically</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you use our Services, we automatically collect certain information:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers</li>
              <li><strong>Usage Data:</strong> Pages viewed, features used, time spent on the app</li>
              <li><strong>Location Data:</strong> Approximate location based on IP address (with your permission, precise location for concert detection)</li>
              <li><strong>Log Data:</strong> IP address, browser type, access times, and referring URLs</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3 Information from Third Parties</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Setlist.fm:</strong> Concert and setlist information to enhance your memories</li>
              <li><strong>OAuth Providers:</strong> If you sign in with Google, Apple, or other services, we receive basic profile information</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Provide, maintain, and improve our Services</li>
              <li>Process your concert photos using AI to identify artists, venues, and dates</li>
              <li>Create and manage your concert history</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns to improve user experience</li>
              <li>Detect, prevent, and address technical issues and fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Share Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell your personal information. We may share your information in the following situations:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Service Providers:</strong> Third-party vendors who perform services on our behalf (cloud storage, AI processing, payment processing)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>With Your Consent:</strong> When you explicitly agree to share information</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. AI Processing and Photos</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your concert photos are processed using AI technology to identify:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Artist names and band information</li>
              <li>Venue names and locations</li>
              <li>Concert dates and times</li>
              <li>Visual elements to improve accuracy</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Important:</strong> Your photos are stored securely and are never used to train AI models
              or shared with third parties without your explicit consent. You maintain full ownership of your photos
              and can delete them at any time.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement appropriate technical and organizational measures to protect your information:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure cloud storage infrastructure</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication requirements</li>
              <li>Employee training on data protection</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              However, no method of transmission over the Internet is 100% secure. While we strive to
              protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Privacy Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Restriction:</strong> Limit how we process your data</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              To exercise these rights, contact us at privacy@encore.app
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your information for as long as necessary to provide our Services and comply with
              legal obligations. When you delete your account, we will delete or anonymize your information
              within 30 days, except where we are required to retain it for legal purposes.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children&apos;s Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our Services are not intended for children under 13 years of age. We do not knowingly collect
              personal information from children under 13. If you believe we have collected information from
              a child under 13, please contact us immediately.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of
              residence. These countries may have different data protection laws. We ensure appropriate
              safeguards are in place to protect your information.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Third-Party Links</h2>
            <p className="text-gray-700 leading-relaxed">
              Our Services may contain links to third-party websites. We are not responsible for the privacy
              practices of these websites. We encourage you to read their privacy policies.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. California Privacy Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              California residents have specific rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Right to know what personal information is collected</li>
              <li>Right to know if personal information is sold or disclosed</li>
              <li>Right to opt-out of the sale of personal information</li>
              <li>Right to deletion of personal information</li>
              <li>Right to non-discrimination for exercising CCPA rights</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. GDPR Rights (EU Users)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you are located in the European Economic Area, you have additional rights under GDPR:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Right to withdraw consent at any time</li>
              <li>Right to object to processing</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
              <li>Right to data portability</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by
              posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are
              advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <p className="text-gray-700 mb-2"><strong>Email:</strong> privacy@encore.app</p>
              <p className="text-gray-700 mb-2"><strong>Support:</strong> support@encore.app</p>
              <p className="text-gray-700"><strong>Mail:</strong> Encore Privacy Team, [Address]</p>
            </div>
          </section>

          <section className="mb-12 bg-purple-50 p-6 rounded-lg border border-purple-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Data, Your Control</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              At Encore, we believe you should have full control over your data. You can:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Download all your data at any time from your account settings</li>
              <li>Delete individual photos or your entire account instantly</li>
              <li>Opt-out of AI processing (manual entry only mode available)</li>
              <li>Control what information is shared publicly</li>
            </ul>
            <p className="text-gray-700 leading-relaxed font-semibold">
              We will never sell your personal information or photos to third parties. Period.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
