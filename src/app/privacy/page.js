'use client'

import PublicLayout from '@/components/layout/PublicLayout'
import Card from '@/components/ui/Card'
import { Shield, Calendar, Eye, Lock, Database, UserCheck } from 'lucide-react'

export default function PrivacyPage() {
  const sections = [
    {
      icon: Database,
      title: '1. Information We Collect',
      content: `We collect information you provide directly to us, such as when you create an account, make a donation, or contact us. This includes your name, email address, phone number, payment information, and any other information you choose to provide.`
    },
    {
      icon: Eye,
      title: '2. How We Use Your Information',
      content: `We use the information we collect to provide, maintain, and improve our services, process donations, send you technical notices and support messages, and communicate with you about products, services, and events.`
    },
    {
      icon: UserCheck,
      title: '3. Information Sharing',
      content: `We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share information with NGOs for donation processing and with service providers who assist us in operating our platform.`
    },
    {
      icon: Lock,
      title: '4. Data Security',
      content: `We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.`
    }
  ]

  const dataTypes = [
    {
      category: 'Personal Information',
      items: ['Name', 'Email address', 'Phone number', 'Postal address', 'Date of birth']
    },
    {
      category: 'Financial Information',
      items: ['Payment method details', 'Donation history', 'Transaction records', 'Tax receipt information']
    },
    {
      category: 'Usage Information',
      items: ['Pages visited', 'Time spent on platform', 'Click patterns', 'Device information', 'IP address']
    },
    {
      category: 'Communication Data',
      items: ['Messages sent through platform', 'Support inquiries', 'Feedback and reviews', 'Newsletter preferences']
    }
  ]

  const rights = [
    'Access your personal data',
    'Correct inaccurate data',
    'Delete your personal data',
    'Restrict processing of your data',
    'Data portability',
    'Object to processing',
    'Withdraw consent'
  ]

  return (
    // <PublicLayout showSidebar={true}>
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <div className="flex items-center justify-center text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Last updated: December 15, 2024</span>
            </div>
          </div>

          {/* Introduction */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Privacy Matters</h2>
            <p className="text-gray-600 mb-4">
              At Utsarg, we are committed to protecting your privacy and ensuring the security of your 
              personal information. This Privacy Policy explains how we collect, use, disclose, and 
              safeguard your information when you use our platform.
            </p>
            <p className="text-gray-600">
              By using our platform, you agree to the collection and use of information in accordance 
              with this policy.
            </p>
          </Card>

          {/* Main Sections */}
          <div className="space-y-6 mb-8">
            {sections.map((section, index) => {
              const Icon = section.icon
              return (
                <Card key={index} className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        {section.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {section.content}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Data Types */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Types of Data We Collect</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dataTypes.map((type, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{type.category}</h3>
                  <ul className="space-y-1">
                    {type.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-gray-600 text-sm flex items-center">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          {/* Your Rights */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Rights</h2>
            <p className="text-gray-600 mb-6">
              You have certain rights regarding your personal data. You can exercise these rights by 
              contacting us at privacy@utsarg.org.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rights.map((right, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span className="text-gray-700">{right}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Additional Sections */}
          <div className="space-y-6 mb-8">
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">5. Cookies and Tracking</h3>
              <p className="text-gray-600">
                We use cookies and similar tracking technologies to enhance your experience on our platform. 
                You can control cookie settings through your browser preferences. For more details, please 
                see our Cookie Policy.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">6. Data Retention</h3>
              <p className="text-gray-600">
                We retain your personal information for as long as necessary to provide our services and 
                comply with legal obligations. Donation records may be retained for tax and legal compliance 
                purposes as required by law.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">7. International Transfers</h3>
              <p className="text-gray-600">
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place to protect your personal information in 
                accordance with this Privacy Policy.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">8. Children's Privacy</h3>
              <p className="text-gray-600">
                Our platform is not intended for children under 13 years of age. We do not knowingly 
                collect personal information from children under 13. If you become aware that a child 
                has provided us with personal information, please contact us.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">9. Changes to Privacy Policy</h3>
              <p className="text-gray-600">
                We may update this Privacy Policy from time to time. We will notify you of any changes 
                by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </Card>
          </div>

          {/* Contact */}
          <Card className="p-8 bg-green-50 border-green-200">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-green-900 mb-4">
                Questions About Your Privacy?
              </h3>
              <p className="text-green-800 mb-6">
                If you have any questions about this Privacy Policy or our data practices, please contact us.
              </p>
              <div className="space-y-2">
                <p className="text-green-700">
                  <strong>Email:</strong> privacy@utsarg.org
                </p>
                <p className="text-green-700">
                  <strong>Phone:</strong> +91 98765 43210
                </p>
                <p className="text-green-700">
                  <strong>Address:</strong> Mumbai, Maharashtra, India
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    // </PublicLayout>
  )
}