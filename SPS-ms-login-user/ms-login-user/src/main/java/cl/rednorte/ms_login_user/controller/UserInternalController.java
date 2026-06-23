package cl.rednorte.ms_login_user.controller;

import cl.rednorte.ms_login_user.dto.UserDTO;
import cl.rednorte.ms_login_user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class UserInternalController {

    private final UserService userService;

    @GetMapping("/by-username/{username}")
    public ResponseEntity<UserDTO> getByUsername(@PathVariable String username) {
        return userService.findByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/roles")
    public ResponseEntity<List<String>> getRoles(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getRolesByUserId(id));
    }
}
