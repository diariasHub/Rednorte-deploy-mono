package cl.rednorte.ms_login_user.mapper;

import cl.rednorte.ms_login_user.dto.UserDTO;
import cl.rednorte.ms_login_user.model.Role;
import cl.rednorte.ms_login_user.model.User;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class UsuarioMapper {

    public UserDTO toDto(User user) {
        if (user == null) return null;
        return UserDTO.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .active(user.isActive())
                .roles(user.getRoles().stream()
                        .map(Role::getName)
                        .collect(Collectors.toSet()))
                .build();
    }

    public User toEntity(UserDTO dto) {
        if (dto == null) return null;
        User user = new User();
        user.setUserId(dto.getUserId());
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setActive(dto.isActive());
        // Note: roles should be loaded from DB and set separately
        return user;
    }
}
