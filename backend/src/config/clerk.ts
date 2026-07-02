
import {clerkMiddleware, clerkClient, getAuth} from '@clerk/express'
import { NextFunction, Request, Response } from 'express'
import { UnauthorizedError } from '../lib/errors.js'


export {clerkMiddleware, clerkClient, getAuth}

export function requireAuthApi(
  req : Request,
  _res : Response,
  next : NextFunction
) :
void{
 const auth = getAuth(req)
 
 if(!auth.userId){
  return next(new UnauthorizedError('You must be signed in to access'))
 }

 return next()
}