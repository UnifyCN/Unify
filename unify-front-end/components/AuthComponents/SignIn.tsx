import React from 'react';

import { useForm } from 'react-hook-form';
import { View, Text } from 'react-native';
import { SignInProps } from '@aws-amplify/ui-react-native';

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
                rules={{ required: `${label} is required` }}
                style={[
                  styles.textField,
                  (errors?.[name]?.message || errorMessage) && { borderColor: '#f00' }, // Red border for error
                ]}
              />
              {/* Display the error message below the TextField */}
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
        textStyle={[styles.buttonText]}
      >
        Submit
      </SubmitButton>

      

      <LinksContainer>
        <LinkButton onPress={toSignUp} style={[styles.link]}>
          Sign Up
        </LinkButton>
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
    fontSize: 48,
    fontWeight: '700',
    color: '#000', // Black text for the header
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#ccc', // Light grey background for buttons
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  buttonText: {
    color: '#333', // Dark grey text for buttons
    fontWeight: 'bold',
    textAlign: 'center',
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
    marginTop: 4,
  },
  link: {
    color: '#333', 
    textDecorationLine: 'none',
    marginVertical: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '500' as '500', // Ensure fontWeight is a valid type
    color: '#000', // Black text for labels
    marginBottom: 8,
    marginTop: 13,
  },
};