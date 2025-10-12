import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Testing bcryptjs import...')
    
    // Test bcryptjs import
    let bcryptjs
    try {
      bcryptjs = await import('bcryptjs')
      console.log('bcryptjs imported successfully')
    } catch (importError) {
      console.error('bcryptjs import failed:', importError)
      return NextResponse.json({
        success: false,
        error: 'bcryptjs import failed',
        details: importError.message
      }, { status: 500 })
    }
    
    // Test bcryptjs functionality
    const testPassword = 'test123'
    const hash = await bcryptjs.default.hash(testPassword, 10)
    console.log('Hash created:', hash.substring(0, 20) + '...')
    
    const isValid = await bcryptjs.default.compare(testPassword, hash)
    console.log('Password verification:', isValid)
    
    // Test JWT
    let jwt
    try {
      jwt = await import('jsonwebtoken')
      console.log('jsonwebtoken imported successfully')
    } catch (jwtError) {
      console.error('jsonwebtoken import failed:', jwtError)
      return NextResponse.json({
        success: false,
        error: 'jsonwebtoken import failed',
        details: jwtError.message
      }, { status: 500 })
    }
    
    // Test JWT functionality
    const testToken = jwt.default.sign({ test: 'data' }, 'secret', { expiresIn: '1h' })
    console.log('JWT created:', testToken.substring(0, 20) + '...')
    
    const decoded = jwt.default.verify(testToken, 'secret')
    console.log('JWT decoded:', decoded)
    
    return NextResponse.json({
      success: true,
      message: 'All packages working correctly',
      tests: {
        bcryptjs: {
          imported: true,
          hashWorking: !!hash,
          verificationWorking: isValid
        },
        jwt: {
          imported: true,
          signWorking: !!testToken,
          verifyWorking: !!decoded
        }
      }
    })
    
  } catch (error) {
    console.error('Package test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Package test failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}