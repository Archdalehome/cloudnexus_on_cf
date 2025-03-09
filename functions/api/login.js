/// <reference types="@cloudflare/workers-types" />
import bcrypt from 'bcryptjs'

export async function onRequestPost(context) {
  try {
    const { username, password } = await context.request.json()

    // 参数验证
    if (!username || !password) {
      return new Response(JSON.stringify({
        error: '用户名和密码不能为空'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 从D1数据库中查询用户
    const stmt = context.env.DB.prepare('SELECT * FROM users WHERE username = ?')
    const { results } = await stmt.bind(username).all()
    
    if (!results || results.length === 0) {
      console.error('User not found:', username)
      return new Response(JSON.stringify({
        error: '用户名或密码错误'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const user = results[0]
    
    try {
      // 使用同步方法进行密码验证，避免异步操作可能的问题
      const isValid = bcrypt.compareSync(password, user.password)
      if (!isValid) {
        console.error('Password verification failed for user:', username)
        return new Response(JSON.stringify({
          error: '用户名或密码错误'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    } catch (verifyError) {
      console.error('Password verification error:', verifyError)
      throw new Error('密码验证过程出错')
    }

    // 生成JWT token
    const token = await generateToken(user, context)

    return new Response(JSON.stringify({
      token,
      user: {
        id: user.id,
        username: user.username
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Login process error:', error)
    return new Response(JSON.stringify({
      error: '登录失败',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function generateToken(user, context) {
  const payload = {
    sub: user.id,
    username: user.username,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24小时过期
  }
  
  const encoder = new TextEncoder()
  const secretKeyData = encoder.encode(context.env.JWT_SECRET)
  const key = await crypto.subtle.importKey(
    'raw',
    secretKeyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  
  const signatureInput = `${encodedHeader}.${encodedPayload}`
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signatureInput)
  )
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`
}