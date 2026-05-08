package com.gradingSystem.GraadingSystem.securityConfig;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfiguration {

     private final UserDetailsService userDetailsService;
     private final JwtService jwtService;   // ✅ ADD THIS

     public SecurityConfiguration(UserDetailsService userDetailsService,
                                  JwtService jwtService) {   // ✅ ADD THIS
          this.userDetailsService = userDetailsService;
          this.jwtService = jwtService;   // ✅ ASSIGN IT
     }

     @Bean
     public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

          http
                  .cors(Customizer.withDefaults())   // ✅ ENABLE CORS
                  .csrf(csrf -> csrf.disable())
                  .authorizeHttpRequests(auth -> auth
                          .requestMatchers("/auth/**",
                                  "/public/**",
                                  "/ranking/**",
                                  "/classes/**",
                                  "/students/**" ).permitAll()
                          .anyRequest().authenticated()
                  )
                  .sessionManagement(session ->
                          session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                  );

          http.addFilterBefore(
                  new JwtAuthenticationFilter(jwtService, userDetailsService),
                  UsernamePasswordAuthenticationFilter.class
          );

          return http.build();
     }



     @Bean
     public AuthenticationProvider authenticationProvider() {

          DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
          provider.setPasswordEncoder(passwordEncoder());

          return provider;
     }

     @Bean
     public PasswordEncoder passwordEncoder() {
          return new BCryptPasswordEncoder();
     }


     @Bean
     public AuthenticationManager authenticationManager(
             AuthenticationConfiguration configuration
     ) throws Exception {
          return configuration.getAuthenticationManager();
     }
}
