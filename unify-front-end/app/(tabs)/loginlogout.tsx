import React from 'react';

import { useColorScheme } from 'react-native';
import {
  MD3LightTheme as LightTheme,
  MD3DarkTheme as DarkTheme,
  PaperProvider,
} from 'react-native-paper';
import {
  Authenticator,
  AuthenticatorProps,
} from '@aws-amplify/ui-react-native';
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

// import { ConfirmResetPassword } from './ConfirmResetPassword';
// import { ConfirmSignIn } from './ConfirmSignIn';
// import { ConfirmSignUp } from './ConfirmSignUp';
// import { ConfirmVerifyUser } from './ConfirmVerifyUser';
// import { ForceNewPassword } from './ForceNewPassword';
// import { ForgotPassword } from './ForgotPassword';
// import { SelectMfaType } from './SelectMfaType';
// import { SetupEmail } from './SetupEmail';
// import { SetupTotp } from './SetupTotp';
import { SignIn } from '../../components/AuthComponents/SignIn';
import { SignUp } from '../../components/AuthComponents/SignUp';
// import { VerifyUser } from './VerifyUser';
import { Container, SignOutButton } from '../../components/AuthComponents/Components';

Amplify.configure(outputs);

const components: AuthenticatorProps['components'] = {
  // ConfirmResetPassword,
  // ConfirmSignIn,
  // ConfirmSignUp,
  // ConfirmVerifyUser,
  // ForceNewPassword,
  // ForgotPassword,
  // SelectMfaType,
  // SetupEmail,
  // SetupTotp,
  SignIn,
  SignUp,
  // VerifyUser,
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    // Attributes for dark mode for paper provider: theme={isDarkMode ? DarkTheme : LightTheme}
    <PaperProvider >
      <Authenticator.Provider>
        <Authenticator Container={Container} components={components}>
          <SignOutButton />
        </Authenticator>
      </Authenticator.Provider>
    </PaperProvider>
  );
}

export default App;