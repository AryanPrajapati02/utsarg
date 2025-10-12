import PublicLayout from '@/components/layout/PublicLayout';

export default function CookiePolicy() {
  return (
    // <PublicLayout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Cookie Policy</h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-6">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Are Cookies</h2>
                <p className="text-gray-700 mb-4">
                  Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
                  They are widely used to make websites work more efficiently and to provide information to website owners.
                </p>
                <p className="text-gray-700 mb-4">
                  At Utsarg, we use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
                  This Cookie Policy explains what cookies are, how we use them, and your choices regarding cookies.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Cookies</h2>
                <p className="text-gray-700 mb-4">
                  We use cookies for several purposes:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li><strong>Essential Cookies:</strong> These are necessary for the website to function properly</li>
                  <li><strong>Authentication Cookies:</strong> To keep you logged in and secure your session</li>
                  <li><strong>Preference Cookies:</strong> To remember your settings and preferences</li>
                  <li><strong>Analytics Cookies:</strong> To understand how visitors use our website</li>
                  <li><strong>Performance Cookies:</strong> To improve website functionality and user experience</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Types of Cookies We Use</h2>
                
                <div className="space-y-6">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Strictly Necessary Cookies</h3>
                    <p className="text-gray-700 mb-2">
                      These cookies are essential for the website to function and cannot be switched off in our systems.
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-1">
                      <li>Authentication tokens (JWT)</li>
                      <li>Session management</li>
                      <li>Security features</li>
                      <li>Form submission data</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Performance Cookies</h3>
                    <p className="text-gray-700 mb-2">
                      These cookies help us understand how visitors interact with our website.
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-1">
                      <li>Page load times</li>
                      <li>User navigation patterns</li>
                      <li>Error tracking</li>
                      <li>Feature usage statistics</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Functional Cookies</h3>
                    <p className="text-gray-700 mb-2">
                      These cookies enable enhanced functionality and personalization.
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-1">
                      <li>Language preferences</li>
                      <li>Theme settings</li>
                      <li>Dashboard customizations</li>
                      <li>Saved search filters</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Cookies</h3>
                    <p className="text-gray-700 mb-2">
                      These cookies help us improve our website by collecting anonymous usage data.
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-1">
                      <li>Google Analytics (if implemented)</li>
                      <li>Campaign performance tracking</li>
                      <li>Donation flow analytics</li>
                      <li>User engagement metrics</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Cookies</h2>
                <p className="text-gray-700 mb-4">
                  We may use third-party services that set their own cookies:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li><strong>Payment Processors:</strong> Razorpay and other payment gateways may set cookies for secure transactions</li>
                  <li><strong>Analytics Services:</strong> Google Analytics or similar services for website analytics</li>
                  <li><strong>Social Media:</strong> Social sharing buttons may set cookies from respective platforms</li>
                  <li><strong>Email Services:</strong> Email service providers for newsletter and notification management</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookie Duration</h2>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Cookies</h3>
                  <p className="text-gray-700">
                    These are temporary cookies that expire when you close your browser. They are used for essential 
                    functions like maintaining your login session.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Persistent Cookies</h3>
                  <p className="text-gray-700">
                    These cookies remain on your device for a set period or until you delete them. They are used to 
                    remember your preferences and improve your experience on return visits.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Managing Your Cookie Preferences</h2>
                <p className="text-gray-700 mb-4">
                  You have several options for managing cookies:
                </p>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Browser Settings</h3>
                    <p className="text-gray-700 mb-2">
                      Most browsers allow you to control cookies through their settings:
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-1">
                      <li>Block all cookies</li>
                      <li>Block third-party cookies only</li>
                      <li>Delete cookies when you close the browser</li>
                      <li>Allow cookies from specific sites</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Cookie Consent</h3>
                    <p className="text-gray-700">
                      When you first visit our website, you'll see a cookie consent banner. You can choose to accept 
                      all cookies or customize your preferences. You can change these preferences at any time by 
                      clicking the "Cookie Settings" link in our footer.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Browser-Specific Instructions</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Google Chrome</h3>
                    <p className="text-gray-700 text-sm">
                      Settings → Privacy and security → Cookies and other site data
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Mozilla Firefox</h3>
                    <p className="text-gray-700 text-sm">
                      Options → Privacy & Security → Cookies and Site Data
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Safari</h3>
                    <p className="text-gray-700 text-sm">
                      Preferences → Privacy → Manage Website Data
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Microsoft Edge</h3>
                    <p className="text-gray-700 text-sm">
                      Settings → Cookies and site permissions → Cookies and site data
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Impact of Disabling Cookies</h2>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-gray-700 mb-2">
                    <strong>Please note:</strong> Disabling certain cookies may affect your experience on our website:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>You may need to log in repeatedly</li>
                    <li>Your preferences may not be saved</li>
                    <li>Some features may not work properly</li>
                    <li>Donation processes may be interrupted</li>
                    <li>Personalized content may not be available</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
                <p className="text-gray-700 mb-4">
                  We take the security of your data seriously. Our cookies are:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li><strong>Encrypted:</strong> Sensitive data in cookies is encrypted</li>
                  <li><strong>Secure:</strong> Transmitted only over HTTPS connections</li>
                  <li><strong>HttpOnly:</strong> Protected from client-side script access where appropriate</li>
                  <li><strong>SameSite:</strong> Protected against cross-site request forgery attacks</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Updates to This Policy</h2>
                <p className="text-gray-700 mb-4">
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for other 
                  operational, legal, or regulatory reasons. We will notify you of any material changes by posting the 
                  updated policy on our website and updating the "Last updated" date.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
                <p className="text-gray-700 mb-4">
                  If you have any questions about our use of cookies or this Cookie Policy, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="text-gray-700 space-y-2">
                    <li><strong>Email:</strong> privacy@utsarg.org</li>
                    <li><strong>Phone:</strong> +91-XXXX-XXXXXX</li>
                    <li><strong>Address:</strong> [Your Organization Address]</li>
                    <li><strong>Website:</strong> <a href="/contact" className="text-blue-600 hover:text-blue-800">Contact Form</a></li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
                <p className="text-gray-700 mb-4">
                  Under applicable data protection laws, you have the right to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li>Know what cookies we use and why</li>
                  <li>Choose which cookies to accept or reject</li>
                  <li>Change your cookie preferences at any time</li>
                  <li>Request deletion of your data</li>
                  <li>Access information about how your data is processed</li>
                </ul>
              </section>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Cookie Consent Management</h3>
                <p className="text-blue-800 mb-4">
                  You can manage your cookie preferences at any time by clicking the button below:
                </p>
                <button 
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    // This would trigger your cookie consent manager
                    alert('Cookie preferences panel would open here');
                  }}
                >
                  Manage Cookie Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    // </PublicLayout>
  );
}