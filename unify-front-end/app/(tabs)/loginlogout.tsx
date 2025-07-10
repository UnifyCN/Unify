import 'react-native-url-polyfill/auto'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Auth from '../../components/AuthComponents/SignInSupa'
import { SignIn } from '../../components/AuthComponents/SignIn'
import { SignUp } from '../../components/AuthComponents/SignUp'

import { View, Text } from 'react-native'
import { Session } from '@supabase/supabase-js'

export default function SupabaseSigningTest(): JSX.Element {
  const [session, setSession] = useState<Session | null>(null)
   const [showSignIn, setShowSignIn] = useState(true); // Local routing state, will fix after when we got more auth pages like forgot pass, confirmation code, etc.

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  return showSignIn ? (
    <SignIn toggleToSignUp={() => setShowSignIn(false)} />
    ) : (
    <SignUp toggleToSignIn={() => setShowSignIn(true)} />
    );    
}