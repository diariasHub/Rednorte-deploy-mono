package cl.rednorte.ms_login_user.security;

import cl.rednorte.ms_login_user.model.Role;
import cl.rednorte.ms_login_user.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomUserDetails implements UserDetails {

    private Long userId;
    private String username;
    private String password;
    private boolean enabled;
    private boolean mfaEnabled;
    private Instant lockedUntil;
    private Integer practitionerId;
    private Collection<? extends GrantedAuthority> authorities;

    public static CustomUserDetails from(User user) {
        Set<Role> roles = user.getRoles() == null ? Collections.emptySet() : user.getRoles();
        Collection<GrantedAuthority> grants = roles.stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r.getName()))
                .collect(Collectors.toUnmodifiableSet());
        return CustomUserDetails.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .password(user.getPassword())
                .enabled(user.isActive())
                .mfaEnabled(user.isMfaEnabled())
                .lockedUntil(user.getLockedUntil())
                .practitionerId(user.getPractitionerId())
                .authorities(grants)
                .build();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return lockedUntil == null || Instant.now().isAfter(lockedUntil);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
}
