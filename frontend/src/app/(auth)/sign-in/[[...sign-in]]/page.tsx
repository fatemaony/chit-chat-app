import  {SignIn} from "@clerk/nextjs"
import Link from "next/link"



export default function SignInPage(){
  return (
    <div className="flex flex-col gap-5 items-center justify-center h-screen">
      <div>
        <h1 className="text-4xl py-5 font-semibold mt-10">Welcome Back</h1>
      </div>
      <div>
        <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl='/'
        />
      </div>

    </div>
  )
}