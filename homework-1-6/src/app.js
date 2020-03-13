const Koa = require('koa')
const Router = require('@koa/router')
const ValidErr = require('./ValidErr')

const app = new Koa()
const router = new Router()

router.post('/api/user', async (ctx, next) => {
  const reqData = await parsePostData(ctx)
  const data = parseJson(reqData)
  
  assertNotNull(data, 404, '请输入json格式数据')
  assertNotEmptyStr(data.name, 404, 'name不能为空')
  assertNotEmptyStr(data.email, 404, 'email不能为空')
  
  assertEqual(ctx.header.role, 'admin', 401, 'unauthorized post')

  ctx.body = {
    code: 200,
	data: data,
	msg: '上传成功'
  }
})


var globalErrorHandler = async (ctx, next) => {
  try {
    await next()
  } catch (err) {
	if (err instanceof ValidErr) {
	  ctx.status = err.code
	  ctx.body = {
	    code: err.code,
		msg: err.msg
	  }
	  return
	}
    ctx.status = 500
	ctx.body = err
  }
}

app
  .use(globalErrorHandler)
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(3000)

function assertNotNull(val, code, msg) {
  if (val == null || val == undefined) {
    throw new ValidErr(code, msg)
  }
}
function assertEqual(val1, val2, code, msg) {
  if (val1 != val2) {
    throw new ValidErr(code, msg)
  }
}
function assertNotEmptyStr(val, code, msg) {
  if (val == null || val == undefined 
	    || (typeof val == 'string' && val.trim().length == 0)) {
    throw new ValidErr(code, msg)
  }
}


function parseJson(str) {
  try {
    return JSON.parse(str)
  } catch (e) {
    return null
  }
}

function parsePostData(ctx) {
  return new Promise((resolve, reject) => {
    try {
        let postStr = ''
		ctx.req.on('data', function(chunk) {
		  postStr += chunk
		})
		ctx.req.on('end', function() {
		  resolve(postStr)
		})
	} catch(e) {
		reject(e)
	}
  });
}
