package cl.rednorte.ms_login_user.service;

import cl.rednorte.ms_login_user.dto.UserDTO;
import cl.rednorte.ms_login_user.model.User;

import java.util.List;
import java.util.Optional;

public interface UserService {
    List<UserDTO> findAll();
    Optional<UserDTO> findById(Long id);
    Optional<UserDTO> findByUsername(String username);
    List<String> getRolesByUserId(Long id);
    UserDTO save(UserDTO userDTO);
    UserDTO update(Long id, UserDTO userDTO);
    void deleteById(Long id);
}
