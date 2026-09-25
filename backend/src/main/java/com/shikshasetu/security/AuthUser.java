package com.shikshasetu.security;

import com.shikshasetu.user.Role;

/** Lightweight authenticated principal stored in the SecurityContext. */
public record AuthUser(Long id, String email, String name, Role role) {
}
