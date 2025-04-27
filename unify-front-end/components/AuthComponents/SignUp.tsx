import React from 'react';

import { useForm } from 'react-hook-form';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { SignUpProps } from '@aws-amplify/ui-react-native';
import { CheckBox } from 'react-native-elements';

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

export function SignUp({
  error: errorMessage,
  fields,
  handleSubmit,
  isPending,
  socialProviders,
  toSignIn,
}: SignUpProps): React.JSX.Element {
  const {
    control,
    formState: { errors, isValid },
    getValues,
  } = useForm({ mode: 'onTouched' });

  // State vars
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [isEmailValid, setIsEmailValid] = React.useState(false);
  const [isChecked, setIsChecked] = React.useState(false);

  const validateEmail = (email: string) => {
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(email));
  };
  return (
    <ViewContainer style={styles.container}>
      <ViewHeader style={styles.header}>Log In</ViewHeader>      
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
      
      {/* Terms and conditions checkbox */}
      <View style={styles.checkboxRow}>
        <CheckBox
          checked={isChecked}
          onPress={() => setIsChecked(!isChecked)}
          containerStyle={styles.checkboxContainer}
          iconType="material-community"
          checkedIcon="checkbox-marked"
          uncheckedIcon="checkbox-blank-outline"
          checkedColor='black'
          uncheckedColor='black'
          wrapperStyle={styles.checkboxWrapper}
        />
        <Text style={styles.checkboxText}>
          I accept the{' '}
          <Text
            style={styles.checkboxLinkText}
            onPress={() => {
              // Leave the link empty for now
            }}
          >
            terms and privacy policy
          </Text>
        </Text>
      </View>

      <SubmitButton
        disabled={!isValid}
        loading={isPending}
        onPress={() => {
          handleSubmit(getValues());
        }}
        style={[
          styles.button,
          (!isValid || !isChecked) && styles.buttonDisabled, // Button is disabled is privacy poli checkbox not checked
        ]}
        labelStyle={[styles.buttonText]}
      >
        Sign Up
      </SubmitButton>     

      {/* <LinksContainer>        
        <LinkButton onPress={toForgotPassword} style={undefined} labelStyle={[styles.link, styles.linkText]}>
          Forgot Password?
        </LinkButton>
      </LinksContainer> */}

        <View style={styles.footer}>
            <Text style={{fontSize: 14, lineHeight: 18, color: "rgba(0, 0, 0, 0.7)", textAlign: "left"}}>Already have an account?</Text>
            <Text 
              style={{fontSize: 14, lineHeight: 18, textDecorationLine: "underline", fontWeight: "600", textAlign: "left", color: "#000"}}           
            
            >Log In</Text>
        </View>
    </ViewContainer>   
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16 * 0.87,
  },
  header: {
    fontSize: 34 * 0.87,
    fontWeight: '700' as '700',
    color: '#000',
    marginBottom: 7 * 0.87,
    marginTop: 70 * 0.87,
  },
  button: {
    backgroundColor: '#343434',
    padding: 12 * 0.87,
    borderRadius: 40 * 0.87,
    marginTop: 37 * 0.87,
    width: 110 * 0.87,
    height: 42 * 0.87,
    alignSelf: 'center' as 'center',
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center' as 'center',
    fontSize: 16 * 0.87,
  },
  textField: {
    backgroundColor: '#fff',
    color: '#000',
    borderColor: '#ccc',
    borderWidth: 1 * 0.87,
    borderRadius: 12 * 0.87,
    padding: 8 * 0.87,
    height: 57,
  },
  errorMessage: {
    color: '#f00',
    fontSize: 14 * 0.87,
  },
  link: {
    color: 'black',
    textDecorationLine: 'underline' as 'underline',
  },
  linkText: {
    color: 'black',
    fontSize: 15 * 0.87,
    fontWeight: '400' as '400',
  },
  label: {
    fontSize: 16 * 0.87,
    fontWeight: '400' as '400',
    color: '#000',
    marginBottom: 8 * 0.87,
    marginTop: 13 * 0.87,
  },
  eyeIcon: {
    position: 'absolute' as 'absolute',
    right: 16 * 0.87,
    top: 62 * 0.87,
  },
  tickIcon: {
    position: 'absolute' as 'absolute',
    right: 16 * 0.87,
    top: 60 * 0.87,
  },
  footer: {
    marginTop: 88 * 0.87,
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    gap: 5 * 0.87,
  },
  // Terms and conditions checkbox style
  checkboxContainer: {
    backgroundColor: 'transparent' as 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0,
    marginVertical: 10 * 0.87,
    alignSelf: 'flex-start' as 'flex-start',
  },
  checkboxText: {
    fontSize: 16 * 0.87,
    color: '#000',
    marginLeft: 0 * 0.87,
  },
  checkboxRow: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    alignSelf: 'flex-start' as 'flex-start',
    marginVertical: 10 * 0.87,
    marginLeft: 0,
    paddingLeft: 0,
  },
  checkboxLinkText: {
    fontSize: 16 * 0.87,
    color: 'black' as 'black', // Style the link text
    textDecorationLine: 'underline' as 'underline',
  },
  checkboxWrapper: {
    margin: 0, // Remove wrapper margin
    padding: 0, // Remove wrapper padding
  },
};