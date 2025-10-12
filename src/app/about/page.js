'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import { Heart, Users, Target, Award, Globe, Shield, Info, Phone, FileText, Lock } from 'lucide-react'

export default function AboutPage() {
  const features = [
    {
      icon: Heart,
      title: 'Transparent Donations',
      description: 'Every donation is tracked and verified, ensuring your contributions reach those who need them most.'
    },
    {
      icon: Users,
      title: 'Verified NGOs',
      description: 'All NGOs on our platform are thoroughly verified to ensure legitimacy and impact.'
    },
    {
      icon: Target,
      title: 'Goal-Oriented Campaigns',
      description: 'Clear objectives and measurable outcomes for every campaign and initiative.'
    },
    {
      icon: Award,
      title: 'Impact Tracking',
      description: 'Real-time updates and reports on how your contributions are making a difference.'
    },
    {
      icon: Globe,
      title: 'Wide Reach',
      description: 'Supporting causes across India, from local community projects to national initiatives.'
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Bank-grade security for all transactions and personal information protection.'
    }
  ]

  const stats = [
    { number: '500+', label: 'Verified NGOs' },
    { number: '10,000+', label: 'Donors' },
    { number: '₹50L+', label: 'Donated' },
    { number: '1000+', label: 'Campaigns' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center space-x-8 py-4">
            <Link href="/about" className="flex items-center space-x-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg font-medium">
              <Info className="w-4 h-4" />
              <span>About</span>
            </Link>
            <Link href="/contact" className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Phone className="w-4 h-4" />
              <span>Contact</span>
            </Link>
            <Link href="/terms" className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <FileText className="w-4 h-4" />
              <span>Terms & Conditions</span>
            </Link>
            <Link href="/privacy" className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Lock className="w-4 h-4" />
              <span>Privacy Policy</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              About Utsarg
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Utsarg is India's leading platform connecting generous donors with verified NGOs, 
              making charitable giving transparent, secure, and impactful.
            </p>
          </div>

          {/* Mission Section */}
          <Card className="p-8 mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
                <p className="text-gray-600 mb-4">
                  To create a transparent and efficient ecosystem where every act of giving creates 
                  maximum positive impact. We believe that when donors can see exactly how their 
                  contributions are being used, they are more likely to give generously and consistently.
                </p>
                <p className="text-gray-600">
                  Our platform bridges the gap between those who want to help and those who need help, 
                  ensuring that charitable resources reach their intended destinations with complete 
                  transparency and accountability.
                </p>
              </div>
              <div className="flex justify-center">
                <div className="w-64 h-64 bg-blue-100 rounded-full flex items-center justify-center">
                  <Heart className="w-32 h-32 text-blue-600" />
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <Card key={index} className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </Card>
            ))}
          </div>

          {/* Features Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Why Choose Utsarg?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <Card key={index} className="p-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Story Section */}
          <Card className="p-8 mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Story</h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-gray-600 mb-4">
                Utsarg was founded in 2023 with a simple yet powerful vision: to make charitable giving 
                more transparent, efficient, and impactful. Our founders, having witnessed the challenges 
                faced by both donors and NGOs in the traditional charitable ecosystem, set out to create 
                a platform that would address these pain points.
              </p>
              <p className="text-gray-600 mb-4">
                The name "Utsarg" comes from Sanskrit, meaning "dedication" or "sacrifice for a noble cause." 
                This reflects our core belief that every act of giving, no matter how small, contributes to 
                building a better society.
              </p>
              <p className="text-gray-600">
                Today, Utsarg serves as a bridge between compassionate donors and impactful NGOs across India, 
                facilitating millions of rupees in donations and supporting hundreds of meaningful causes. 
                Our technology-driven approach ensures that every transaction is secure, every NGO is verified, 
                and every donor can track the impact of their contribution.
              </p>
            </div>
          </Card>

          {/* Values Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Transparency</h3>
                <p className="text-gray-600">
                  Complete visibility into how donations are used, with regular updates and impact reports.
                </p>
              </div>
              <div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Trust</h3>
                <p className="text-gray-600">
                  Building lasting relationships through verified NGOs and secure, reliable transactions.
                </p>
              </div>
              <div>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Impact</h3>
                <p className="text-gray-600">
                  Maximizing the positive change created by every donation through efficient processes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}