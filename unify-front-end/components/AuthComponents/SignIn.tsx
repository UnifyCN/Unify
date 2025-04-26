import React from 'react';

import { useForm } from 'react-hook-form';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { SignInProps } from '@aws-amplify/ui-react-native';
import { MaterialIcons } from '@expo/vector-icons';

import {
  ErrorMessage,
  LinkButton,
  LinksContainer,
  ProviderButton,
  SubmitButton,
  TextField,
  ViewHeader,
  ViewContainer,
  ViewSection,
  ViewDivider,
} from './Components';

function capitalize<T extends string>([first, ...rest]: T): Capitalize<T> {
  return [first && first.toUpperCase(), rest.join('').toLowerCase()]
    .filter(Boolean)
    .join('') as Capitalize<T>;
}

export function SignIn({
  error: errorMessage,
  fields,
  handleSubmit,
  isPending,
  socialProviders,
  toFederatedSignIn,
  toForgotPassword,
  toSignUp,
}: SignInProps): React.JSX.Element {
  const {
    control,
    formState: { errors, isValid },
    getValues,
  } = useForm({ mode: 'onTouched' });

  // State for email tick and password eye icon toggle
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [isEmailValid, setIsEmailValid] = React.useState(false);

  const validateEmail = (email: string) => {
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(email));
  };
  return (
    <ViewContainer style={styles.container}>
      <ViewHeader style={styles.header}>Log In</ViewHeader>

      <ViewSection>
        {socialProviders?.map((name) => {
          const provider = capitalize(name);
          return (
            <ProviderButton
              icon={name}
              key={provider}
              onPress={() => toFederatedSignIn({ provider })}
              style={[styles.button]}
              textStyle={[styles.buttonText]}
            >
              Sign in with {provider}
            </ProviderButton>
          );
        }) ?? null}
      </ViewSection>    
      <ViewSection style={{ marginTop: 25 }}>
          {fields.map(({ name, label, ...field }) => (
            <View key={name}>
              {/* Label on top of the text field */}
              <Text style={styles.label}>{label}</Text>
              <TextField
                {...field}
                control={control}
                error={errors?.[name]?.message as string}
                name={name}
                secureTextEntry={field.type === 'password' && !passwordVisible}
                rules={{ required: `${label} is required` }}
                style={[
                  styles.textField,
                  (errors?.[name]?.message || errorMessage) && { borderColor: '#f00' }, // Red border for error
                ]}
                onChangeText={(text) => {
                  field.onChange?.(text); // Pass the text directly
                  if (field.type === 'email') validateEmail(text); // Validate email if the field is email
                }}
              />
              {field.type === 'password' && (
                <TouchableOpacity
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  style={styles.eyeIcon}
                >
                  <MaterialIcons
                    name={passwordVisible ? 'visibility' : 'visibility-off'} // Toggle icon
                    size={24}
                    color="#333"
                  />
                </TouchableOpacity>
              )}
              {field.type === 'email' && isEmailValid && (
                <MaterialIcons
                  name=  "check-circle"
                  size={24}
                  color="black"
                  style={styles.tickIcon}
                />
              )}
            </View>
          ))}
          {(
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          )}
      </ViewSection>

      <SubmitButton
        disabled={!isValid}
        loading={isPending}
        onPress={() => {
          handleSubmit(getValues());
        }}
        style={[styles.button]}
        labelStyle={[styles.buttonText]}
      >
        Log in
      </SubmitButton>

      

      <LinksContainer>        
        <LinkButton onPress={toForgotPassword} style={[styles.link]}>
          Forgot Password?
        </LinkButton>
      </LinksContainer>
    </ViewContainer>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#fff', // White background for the entire page
    padding: 16,
  },
  header: {
    fontSize: 34,
    fontWeight: '700' as '700',
    color: '#000', // Black text for the header
    marginBottom: 7,
  },
  button: {
    backgroundColor: '#343434', // Light grey background for buttons
    padding: 12,
    borderRadius: 40,
    marginVertical: 8,
    marginTop: 55,
    width: '24%' as '24%',
    height: '10%' as '10%',
    alignSelf: 'center' as 'center',   
    justifyContent: 'center' as 'center', 
    alignItems: 'center' as 'center', 
  },
  buttonText: {
    color: 'white', // Dark grey text for buttons
    textAlign: 'center' as 'center',
    fontSize: 16,
  },
  textField: {
    backgroundColor: '#fff', // White background for text fields
    color: '#000', // Black text for input
    borderColor: '#ccc', // Light grey border
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    height: 60,
  },
  errorMessage: {
    color: '#f00', // Red text for error messages
    fontSize: 14,
    
  },
  link: {
    color: '#000', 
    textDecorationLine: 'underline' as 'underline',
    marginVertical: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '400' as '400', // Ensure fontWeight is a valid type
    color: '#000', // Black text for labels
    marginBottom: 8,
    marginTop: 13,
  },  
  eyeIcon: {
    position: 'absolute' as 'absolute',
    right: 16,
    top: 60,
  },
  tickIcon: {
    position: 'absolute' as 'absolute',
    right: 16,
    top: 60,
  },
};