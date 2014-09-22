package org.easyframework.report.web.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Reporting控制器
 */
@Controller
@RequestMapping(value = "/")
public class HomeController extends AbstractController {

	@RequestMapping(value = { "/", "/index" })
	public String index() {
		return "/index";
	}
}