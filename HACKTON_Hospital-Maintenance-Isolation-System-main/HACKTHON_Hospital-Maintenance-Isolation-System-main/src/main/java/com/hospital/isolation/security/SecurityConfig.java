package com.hospital.isolation.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable)) // for H2 Console
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType("application/json");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("{\"status\":401,\"error\":\"UNAUTHORIZED\",\"message\":\"Full authentication is required to access this resource\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setContentType("application/json");
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("{\"status\":403,\"error\":\"FORBIDDEN\",\"message\":\"Access is denied: insufficient role privileges\"}");
                })
            )
            .authorizeHttpRequests(auth -> auth
                // Public endpoints & Static UI
                .requestMatchers("/", "/index.html", "/favicon.ico", "/css/**", "/js/**", "/static/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/eureka/**").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers("/error").permitAll()

                // Requirement 2: Allow an authorized engineer to create an isolation request
                .requestMatchers(HttpMethod.POST, "/api/isolation-requests").hasAnyRole("ENGINEER", "engineer")

                // Requirement 4: Allow an engineer to authorize the repair
                .requestMatchers(HttpMethod.POST, "/api/isolation-requests/*/authorize").hasAnyRole("ENGINEER", "engineer")

                // Requirement 3: Allow ward supervisors to submit room acknowledgements
                .requestMatchers(HttpMethod.POST, "/api/isolation-requests/*/acknowledgements").hasAnyRole("WARD_SUPERVISOR", "wardSupervisor")

                // Common read operations for both roles
                .requestMatchers(HttpMethod.GET, "/api/isolation-requests/**").hasAnyRole("ENGINEER", "engineer", "WARD_SUPERVISOR", "wardSupervisor")
                .requestMatchers(HttpMethod.GET, "/api/valves/**").hasAnyRole("ENGINEER", "engineer", "WARD_SUPERVISOR", "wardSupervisor")

                // All other requests require authentication
                .anyRequest().authenticated()
            );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
