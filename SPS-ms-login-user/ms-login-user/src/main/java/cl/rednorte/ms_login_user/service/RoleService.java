package cl.rednorte.ms_login_user.service;

import cl.rednorte.ms_login_user.model.Role;
import java.util.List;

public interface RoleService {
    List<Role> findAll();
    Role save(Role role);
}
