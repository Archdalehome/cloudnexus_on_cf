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
    const { results } = await context.env.DB.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).bind(username).all()

    const user = results[0]
    if (!user) {
      return new Response(JSON.stringify({
        error: '用户名或密码错误'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return new Response(JSON.stringify({
        error: '用户名或密码错误'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
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
    console.error('Login error:', error);
    let errorMessage = '服务器内部错误';
    let statusCode = 500;

    if (error.message.includes('database')) {
      errorMessage = '数据库操作失败';
    } else if (error.message.includes('token')) {
      errorMessage = 'Token生成失败';
    }

    return new Response(JSON.stringify({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function generateToken(user, context) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }
  
  const payload = {
    id: user.id,
    username: user.username,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
  }
  
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url')
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  
  const secret = context.env.JWT_SECRET || 'your-secret-key'
  const data = base64Header + '.' + base64Payload
  
  // 使用Web Crypto API生成HMAC签名
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  )
  
  const base64Signature = Buffer.from(signature).toString('base64url')
  return `${base64Header}.${base64Payload}.${base64Signature}`
}