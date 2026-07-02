import  {SignUp} from "@clerk/nextjs"
import Link from "next/link"



export default function SignUpPage(){
  return (
    <div className="flex flex-col gap-5 items-center justify-center h-screen">
     <div>
      <h1 className="text-4xl font-semibold mt-20"> Welcome Back</h1>
     </div>
      <div>
        <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl='/'
        />
      </div>
    </div>
  )
}